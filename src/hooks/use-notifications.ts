
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, onSnapshot, doc, writeBatch, deleteDoc, DocumentData, QuerySnapshot, FirestoreError, orderBy, limit, setDoc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import type { Notification, InvitationNotification, AppointmentNotification, FollowUpNotification, Activity, ActivityNotification, Appointment, FollowUp } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { isBefore, sub, differenceInHours } from 'date-fns';

const NOTIFICATION_READ_STATUS_KEY = 'signaturecrm_read_notifications';
const DELETED_NOTIFICATIONS_KEY = 'signaturecrm_deleted_notifications';

export const useNotifications = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useProfile();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const forceRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const canFetch = !!firestore && !!user;
    const canFetchAgencyData = canFetch && !!profile.agency_id;
    
    // --- START: Data Fetching Hooks ---
    const invitationsQuery = useMemoFirebase(() => {
        return (firestore && user?.email) ? query(collection(firestore, 'invitations'), where('toEmail', '==', user.email), where('status', 'in', ['pending', 'Pending'])) : null;
    }, [firestore, user?.email, refreshKey]);
    const { data: invitationsData, isLoading: isInvitesLoading } = useCollection<any>(invitationsQuery);
    
    const appointmentsQuery = useMemoFirebase(() => canFetchAgencyData ? query(collection(firestore, 'agencies', profile.agency_id, 'appointments'), where('agentName', '==', profile.name)) : null, [canFetchAgencyData, firestore, profile.agency_id, profile.name, refreshKey]);
    const { data: appointmentsData, isLoading: isAppointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

    const followUpsQuery = useMemoFirebase(() => {
        if (!canFetchAgencyData) return null;
        const now = new Date();
        const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
        return query(
            collection(firestore, 'agencies', profile.agency_id, 'followUps'),
            where('nextReminderDate', '>=', now.toISOString().split('T')[0]),
            where('nextReminderDate', '<=', futureDate.toISOString().split('T')[0])
        );
    }, [canFetchAgencyData, firestore, profile.agency_id, refreshKey]);
    const { data: followUpsData, isLoading: isFollowUpsLoading } = useCollection<FollowUp>(followUpsQuery);
    
    const activitiesQuery = useMemoFirebase(() => {
        if(!canFetchAgencyData) return null;
        const oneDayAgo = sub(new Date(), { days: 1 });
        return query(
            collection(firestore, 'agencies', profile.agency_id, 'activityLogs'),
            where('timestamp', '>=', oneDayAgo.toISOString()),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
    }, [canFetchAgencyData, firestore, profile.agency_id, refreshKey]);
    const { data: activitiesData, isLoading: isActivitiesLoading } = useCollection<Activity>(activitiesQuery);
    // --- END: Data Fetching Hooks ---


    const getStoredIds = (key: string): string[] => {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    };
    const setStoredIds = (key: string, ids: string[]) => localStorage.setItem(key, JSON.stringify(ids));

    useEffect(() => {
        if (isInvitesLoading || isAppointmentsLoading || isFollowUpsLoading || isActivitiesLoading) {
            setIsLoading(true);
            return;
        }

        const readIds = getStoredIds(NOTIFICATION_READ_STATUS_KEY);
        const deletedIds = getStoredIds(DELETED_NOTIFICATIONS_KEY);
        let allNotifications: Notification[] = [];

        // 1. Process Invitations
        if(invitationsData) {
             const invites: InvitationNotification[] = invitationsData.map(doc => ({
                id: doc.id,
                type: 'invitation',
                title: `Invitation from ${doc.fromAgencyName}`,
                description: `You have been invited to join as a ${doc.role}.`,
                timestamp: doc.invitedAt?.toDate() || new Date(),
                isRead: readIds.includes(doc.id),
                fromAgencyId: doc.fromAgencyId,
                fromAgencyName: doc.fromAgencyName,
                role: doc.role,
                email: doc.toEmail,
                memberDocId: doc.memberDocId 
            }));
            allNotifications.push(...invites);
        }

        // 2. Process Appointments
        if(appointmentsData) {
            const now = new Date();
            const upcomingAppointments = appointmentsData
                .filter(appt => appt.status === 'Scheduled' && isBefore(now, new Date(`${appt.date}T${appt.time}`)))
                .map(appt => ({
                    id: `appt_${appt.id}`,
                    type: 'appointment',
                    title: `Appointment Reminder: ${appt.contactName}`,
                    description: `At ${appt.time} on ${appt.date}.`,
                    timestamp: new Date(`${appt.date}T${appt.time}`),
                    isRead: readIds.includes(`appt_${appt.id}`),
                    appointment: appt,
                    reminderType: 'day'
                } as AppointmentNotification));
            allNotifications.push(...upcomingAppointments);
        }
        
        // 3. Process Follow-ups
        if (followUpsData) {
            const now = new Date();
            const upcomingFollowUps = followUpsData
                .filter(fu => isBefore(now, new Date(`${fu.nextReminderDate}T${fu.nextReminderTime}`)))
                .map(fu => ({
                    id: `fu_${fu.id}`,
                    type: 'followup',
                    title: `Follow-up Reminder: ${fu.buyerName}`,
                    description: `Notes: ${fu.notes}`,
                    timestamp: new Date(`${fu.nextReminderDate}T${fu.nextReminderTime}`),
                    isRead: readIds.includes(`fu_${fu.id}`),
                    followUp: { ...fu, nextReminder: new Date(`${fu.nextReminderDate}T${fu.nextReminderTime}`).toISOString() },
                    reminderType: 'day'
                } as FollowUpNotification));
            allNotifications.push(...upcomingFollowUps);
        }
        
        // 4. Process Activities
        if (activitiesData) {
            const statusUpdateActivities = activitiesData
                .filter(act => act.action.includes('updated') && act.details && act.userName !== profile.name)
                .map(act => ({
                    id: `act_${act.id}`,
                    type: 'activity',
                    title: `Status Update by ${act.userName}`,
                    description: `${act.target} status changed from ${act.details.from} to ${act.details.to}`,
                    timestamp: new Date(act.timestamp),
                    isRead: readIds.includes(`act_${act.id}`),
                    activity: act
                } as ActivityNotification));
            allNotifications.push(...statusUpdateActivities);
        }

        // Filter out deleted notifications and sort
        allNotifications = allNotifications
            .filter(n => !deletedIds.includes(n.id))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setNotifications(allNotifications);
        setIsLoading(false);

    }, [
        invitationsData, appointmentsData, followUpsData, activitiesData,
        isInvitesLoading, isAppointmentsLoading, isFollowUpsLoading, isActivitiesLoading,
        profile.name, refreshKey
    ]);

    const markAsRead = (id: string) => {
        const readIds = getStoredIds(NOTIFICATION_READ_STATUS_KEY);
        if (!readIds.includes(id)) {
            const newReadIds = [...readIds, id];
            setStoredIds(NOTIFICATION_READ_STATUS_KEY, newReadIds);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
    };
    
    const markAllAsRead = () => {
        const currentIds = notifications.map(n => n.id);
        setStoredIds(NOTIFICATION_READ_STATUS_KEY, currentIds);
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    };
    
    const deleteNotification = (notificationId: string) => {
        const deletedIds = getStoredIds(DELETED_NOTIFICATIONS_KEY);
        if (!deletedIds.includes(notificationId)) {
            setStoredIds(DELETED_NOTIFICATIONS_KEY, [...deletedIds, notificationId]);
        }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };
    
    const acceptInvitation = async (invitationId: string, agencyId: string, userId: string) => {
        const batch = writeBatch(firestore);
        
        const invitationData = notifications.find(n => n.id === invitationId) as InvitationNotification;
        if (!invitationData) throw new Error("Invitation not found");
        if (!invitationData.memberDocId) throw new Error("Invitation is corrupted or old. Please ask the admin to resend it.");
        
        const memberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationData.memberDocId);
        batch.update(memberRef, {
             status: 'Active',
             user_id: userId,
             joinedAt: serverTimestamp()
        });
        
        const userRef = doc(firestore, 'users', userId);
        batch.set(userRef, { 
            agency_id: agencyId,
            role: invitationData.role,
            agencyName: invitationData.fromAgencyName
        }, { merge: true });

        const invRef = doc(firestore, 'invitations', invitationId);
        batch.delete(invRef);
        
        await batch.commit();
        deleteNotification(invitationId);
        window.location.reload(); 
    };

    const rejectInvitation = async (invitationId: string, agencyId: string) => {
        const invitationData = notifications.find(n => n.id === invitationId) as InvitationNotification;
        if (!invitationData) return;

        const batch = writeBatch(firestore);

        const invRef = doc(firestore, 'invitations', invitationId);
        batch.delete(invRef);

        if (invitationData.memberDocId) {
            const memberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationData.memberDocId);
            batch.delete(memberRef);
        }

        await batch.commit();
        deleteNotification(invitationId);
    };

    return { notifications, isLoading, acceptInvitation, rejectInvitation, markAsRead, markAllAsRead, deleteNotification, forceRefresh };
};
