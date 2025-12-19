
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

    const invitationsQuery = useMemoFirebase(() => {
        if (firestore && user?.email) {
            return query(
                collection(firestore, 'invitations'), 
                where('toEmail', '==', user.email),
                where('status', 'in', ['pending', 'Pending']) 
            );
        }
        return null;
    }, [firestore, user?.email, refreshKey]);

    const appointmentsQuery = useMemoFirebase(() => canFetchAgencyData ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [canFetchAgencyData, firestore, profile.agency_id, refreshKey]);
    const followUpsQuery = useMemoFirebase(() => canFetchAgencyData ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [canFetchAgencyData, firestore, profile.agency_id, refreshKey]);
    
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

    const getStoredIds = (key: string): string[] => {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    };
    const setStoredIds = (key: string, ids: string[]) => localStorage.setItem(key, JSON.stringify(ids));

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

    useEffect(() => {
        if (!canFetch) { setIsLoading(false); return; }
        
        setIsLoading(true);
        const readIds = getStoredIds(NOTIFICATION_READ_STATUS_KEY);
        const unsubscribers: (() => void)[] = [];
        let allNotifications: Notification[] = [];
        let activeListeners = 0; 
        const checkLoading = () => { activeListeners--; if (activeListeners <= 0) setIsLoading(false); };

        const updateNotifications = (newNotifs: Notification[], type: string) => {
             const deletedIds = getStoredIds(DELETED_NOTIFICATIONS_KEY);
             allNotifications = [
                ...allNotifications.filter(n => n.type !== type), 
                ...newNotifs
             ].filter(n => !deletedIds.includes(n.id));
             
             allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
             setNotifications([...allNotifications]);
        };

        if(invitationsQuery) {
            activeListeners++;
            const unsubInvites = onSnapshot(invitationsQuery, (snapshot) => {
                const invites = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'invitation',
                    title: `Invitation from ${doc.data().fromAgencyName}`,
                    description: `Role: ${doc.data().role}. Click Accept to join.`,
                    timestamp: doc.data().invitedAt?.toDate() || new Date(),
                    isRead: readIds.includes(doc.id),
                    fromAgencyId: doc.data().fromAgencyId,
                    fromAgencyName: doc.data().fromAgencyName,
                    role: doc.data().role,
                    email: doc.data().toEmail,
                    memberDocId: doc.data().memberDocId 
                } as InvitationNotification));
                
                updateNotifications(invites, 'invitation');
                checkLoading();
            }, (err) => { console.error(err); checkLoading(); });
            unsubscribers.push(unsubInvites);
        }
        
        if (activeListeners === 0) setIsLoading(false);

        return () => unsubscribers.forEach(u => u());
    }, [canFetch, firestore, user, profile.agency_id, refreshKey]); 
    
    
    const acceptInvitation = async (invitationId: string, agencyId: string, userId: string) => {
        const batch = writeBatch(firestore);
        
        const invitationData = notifications.find(n => n.id === invitationId) as InvitationNotification;
        
        if (!invitationData) {
            console.error("Invitation data missing locally");
            throw new Error("Invitation not found");
        }
        
        if (!invitationData.memberDocId) {
             console.error("memberDocId is missing from the invitation. Cannot accept.");
             throw new Error("Invitation is corrupted or old. Please ask the admin to resend it.");
        }
        
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

        // Delete the pending member doc too
        if (invitationData.memberDocId) {
            const memberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationData.memberDocId);
            batch.delete(memberRef);
        }

        await batch.commit();
        deleteNotification(invitationId);
    };

    return { notifications, isLoading, acceptInvitation, rejectInvitation, markAsRead, markAllAsRead, deleteNotification, forceRefresh };
};
