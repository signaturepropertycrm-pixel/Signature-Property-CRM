

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirestore, useAuth } from '@/firebase/provider';
import { collection, collectionGroup, query, where, onSnapshot, doc, writeBatch, deleteDoc, DocumentData, QuerySnapshot, FirestoreError, orderBy, limit } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import type { Notification, InvitationNotification, AppointmentNotification, FollowUpNotification, UserRole, Appointment, FollowUp, Activity, ActivityNotification } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { isBefore, sub, isAfter, isToday, parseISO, differenceInHours } from 'date-fns';

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

    const canFetch = !!firestore && !!user && !!profile.agency_id;

    // Queries
    const invitationsQuery = useMemoFirebase(() => {
        if (firestore && user?.email) {
            return query(
                collectionGroup(firestore, 'teamMembers'), 
                where('email', '==', user.email),
                where('status', '==', 'Pending')
            );
        }
        return null;
    }, [firestore, user?.email, refreshKey]);

    const appointmentsQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [canFetch, firestore, profile.agency_id, refreshKey]);
    const followUpsQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [canFetch, firestore, profile.agency_id, refreshKey]);
    
    const activitiesQuery = useMemoFirebase(() => {
        if(!canFetch) return null;
        const oneDayAgo = sub(new Date(), { days: 1 });
        return query(
            collection(firestore, 'agencies', profile.agency_id, 'activityLogs'),
            where('timestamp', '>=', oneDayAgo.toISOString()),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
    }, [canFetch, firestore, profile.agency_id, refreshKey]);

    const getStoredIds = (key: string): string[] => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    };
    
    const setStoredIds = (key: string, ids: string[]) => {
        localStorage.setItem(key, JSON.stringify(ids));
    };


    const markAsRead = (notificationId: string) => {
        const readIds = getStoredIds(NOTIFICATION_READ_STATUS_KEY);
        if (!readIds.includes(notificationId)) {
            const newReadIds = [...readIds, notificationId];
            setStoredIds(NOTIFICATION_READ_STATUS_KEY, newReadIds);
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        }
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setStoredIds(NOTIFICATION_READ_STATUS_KEY, allIds);
        setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    };
    
    const deleteNotification = (notificationId: string) => {
        const deletedIds = getStoredIds(DELETED_NOTIFICATIONS_KEY);
        if (!deletedIds.includes(notificationId)) {
            const newDeletedIds = [...deletedIds, notificationId];
            setStoredIds(DELETED_NOTIFICATIONS_KEY, newDeletedIds);
        }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };


    useEffect(() => {
        if (!canFetch) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        const readIds = getStoredIds(NOTIFICATION_READ_STATUS_KEY);
        const unsubscribers: (() => void)[] = [];
        let allNotifications: Notification[] = [];
        let loadingStates = { invitations: true, appointments: true, followups: true, activities: true };
        const updateLoading = () => setIsLoading(Object.values(loadingStates).some(s => s));

        const updateAndSortNotifications = (newNotifs: Notification[], type: Notification['type']) => {
             const deletedIds = getStoredIds(DELETED_NOTIFICATIONS_KEY);
             allNotifications = [
                ...allNotifications.filter(n => n.type !== type),
                ...newNotifs
             ].filter(n => !deletedIds.includes(n.id));

             allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setNotifications(allNotifications);
        };

        // Invitations
        if(invitationsQuery) {
            const unsubInvites = onSnapshot(invitationsQuery, (snapshot) => {
                const invitationNotifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'invitation',
                    title: `Invitation to join ${doc.data().agency_name}`,
                    description: `You have been invited to join as a ${doc.data().role}.`,
                    timestamp: doc.data().invitedAt?.toDate() || new Date(),
                    isRead: readIds.includes(doc.id),
                    agencyId: doc.data().agency_id,
                    agencyName: doc.data().agency_name,
                    role: doc.data().role,
                    email: doc.data().email,
                } as InvitationNotification));
                
                updateAndSortNotifications(invitationNotifications, 'invitation');
                loadingStates.invitations = false;
                updateLoading();
            }, (error) => {
                console.error("Error fetching invitations:", error);
                loadingStates.invitations = false;
                updateLoading();
            });
            unsubscribers.push(unsubInvites);
        } else {
            loadingStates.invitations = false;
        }

        const areAppointmentNotificationsEnabled = localStorage.getItem('notifications_appointments_enabled') !== 'false';
        // Appointments
        if(appointmentsQuery && areAppointmentNotificationsEnabled) {
             const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
                const now = new Date();
                const appointmentNotifications: AppointmentNotification[] = [];

                snapshot.docs.forEach(doc => {
                    const appt = { id: doc.id, ...doc.data() } as Appointment;
                    if (appt.status !== 'Scheduled' || (profile.role === 'Agent' && appt.agentName !== profile.name)) return;

                    const apptDateTime = new Date(`${appt.date}T${appt.time}`);
                    if (isBefore(apptDateTime, now)) return;

                    const hoursUntil = differenceInHours(apptDateTime, now);
                    
                    const checkAndAddReminder = (reminderType: 'day' | 'hour' | 'minute', title: string) => {
                        const id = `${appt.id}-${reminderType}`;
                        appointmentNotifications.push({
                            id,
                            type: 'appointment',
                            title,
                            description: `With ${appt.contactName} at ${appt.time}`,
                            timestamp: apptDateTime,
                            isRead: readIds.includes(id),
                            appointment: appt,
                            reminderType
                        });
                    };
                    
                    if (hoursUntil > 1 && hoursUntil <= 24) {
                        checkAndAddReminder('day', 'Appointment in 24 hours');
                    }
                    if (hoursUntil > 0.25 && hoursUntil <= 1) {
                        checkAndAddReminder('hour', 'Appointment in 1 hour');
                    }
                    if (hoursUntil >= 0 && hoursUntil <= 0.25) {
                        checkAndAddReminder('minute', 'Appointment in 15 minutes');
                    }
                });
                
                updateAndSortNotifications(appointmentNotifications, 'appointment');
                loadingStates.appointments = false;
                updateLoading();
            });
            unsubscribers.push(unsubAppointments);
        } else {
             loadingStates.appointments = false;
        }

        const areFollowUpNotificationsEnabled = localStorage.getItem('notifications_followups_enabled') !== 'false';
        // Follow-ups
        if(followUpsQuery && areFollowUpNotificationsEnabled) {
            const unsubFollowUps = onSnapshot(followUpsQuery, (snapshot) => {
                const now = new Date();
                const followUpNotifications: FollowUpNotification[] = [];

                snapshot.docs.forEach(doc => {
                    const followUp = { id: doc.id, ...doc.data() } as FollowUp;
                    if (followUp.status !== 'Scheduled') return;

                    const reminderDateTime = new Date(`${followUp.nextReminderDate}T${followUp.nextReminderTime}`);
                    if (isBefore(reminderDateTime, now)) return;

                    const hoursUntil = differenceInHours(reminderDateTime, now);

                     const checkAndAddReminder = (reminderType: 'day' | 'hour' | 'minute', title: string) => {
                        const id = `${followUp.id}-${reminderType}`;
                        followUpNotifications.push({
                            id,
                            type: 'followup',
                            title,
                            description: `Follow up with ${followUp.buyerName}.`,
                            timestamp: reminderDateTime,
                            isRead: readIds.includes(id),
                            followUp,
                            reminderType
                        });
                    };
                    
                    if (hoursUntil > 1 && hoursUntil <= 24) {
                        checkAndAddReminder('day', 'Follow-up in 24 hours');
                    }
                    if (hoursUntil > 0.25 && hoursUntil <= 1) {
                        checkAndAddReminder('hour', 'Follow-up in 1 hour');
                    }
                    if (hoursUntil >= 0 && hoursUntil <= 0.25) {
                        checkAndAddReminder('minute', 'Follow-up in 15 minutes');
                    }
                });

                updateAndSortNotifications(followUpNotifications, 'followup');
                loadingStates.followups = false;
                updateLoading();
            });
            unsubscribers.push(unsubFollowUps);
        } else {
            loadingStates.followups = false;
        }

        // Activities
        if(activitiesQuery) {
            const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
                const activityNotifications: ActivityNotification[] = snapshot.docs.map(doc => {
                     const activity = { id: doc.id, ...doc.data() } as Activity;
                     return {
                        id: activity.id,
                        type: 'activity',
                        title: `${activity.userName} ${activity.action}`,
                        description: activity.target || '',
                        timestamp: new Date(activity.timestamp),
                        isRead: readIds.includes(activity.id),
                        activity
                     }
                }).filter(n => n.activity.userName !== profile.name);
                
                updateAndSortNotifications(activityNotifications, 'activity');
                loadingStates.activities = false;
                updateLoading();
            });
            unsubscribers.push(unsubActivities);
        } else {
            loadingStates.activities = false;
        }

        updateLoading();

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [canFetch, firestore, user, profile.agency_id, profile.name, refreshKey]);
    
    
    const acceptInvitation = async (invitationId: string, agencyId: string, userId: string) => {
        const batch = writeBatch(firestore);
        
        // This is a temporary doc, so we delete it and create a new one with the user's UID
        const invRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationId);
        
        const newMemberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', userId);
        const invitationData = notifications.find(n => n.id === invitationId) as InvitationNotification;
        
        batch.set(newMemberRef, {
             name: invitationData.email, // Or a default name
             email: invitationData.email,
             role: invitationData.role,
             status: 'Active',
             agency_id: agencyId,
             createdAt: new Date(),
        });
        
        const userRef = doc(firestore, 'users', userId);
        batch.update(userRef, { agency_id: agencyId });

        // Finally, delete the original invitation document
        batch.delete(invRef);

        await batch.commit().catch((error) => {
            throw new FirestorePermissionError({ operation: 'write', path: `batch write for invitation` });
        });
        deleteNotification(invitationId);
    };

    const rejectInvitation = async (invitationId: string, agencyId: string) => {
        const invRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationId);
        await deleteDoc(invRef).catch((error) => {
            throw new FirestorePermissionError({ operation: 'delete', path: invRef.path });
        });
        deleteNotification(invitationId);
    };


    return { notifications, isLoading, acceptInvitation, rejectInvitation, markAsRead, markAllAsRead, deleteNotification, forceRefresh };
};
