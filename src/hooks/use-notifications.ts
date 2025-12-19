'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, onSnapshot, doc, writeBatch, deleteDoc, DocumentData, QuerySnapshot, FirestoreError, orderBy, limit } from 'firebase/firestore';
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

    // --- FIX 1: Query ab 'invitations' collection se data laye gi ---
    const invitationsQuery = useMemoFirebase(() => {
        if (firestore && user?.email) {
            return query(
                collection(firestore, 'invitations'), 
                where('toEmail', '==', user.email),
                // Yahan hum dono check kar lenge taake spelling mistake ka masla na ho
                where('status', 'in', ['pending', 'Pending']) 
            );
        }
        return null;
    }, [firestore, user?.email, refreshKey]);

    // ... (Appointments, FollowUps, Activities Queries - Same as before) ...
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

    // ... (LocalStorage Helpers - Same as before) ...
    const getStoredIds = (key: string): string[] => {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    };
    const setStoredIds = (key: string, ids: string[]) => localStorage.setItem(key, JSON.stringify(ids));

    const markAsRead = (id: string) => { /* ... same code ... */ };
    const markAllAsRead = () => { /* ... same code ... */ };
    
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
        // Simplified loading state tracking
        let activeListeners = 0; 
        const checkLoading = () => { activeListeners--; if (activeListeners <= 0) setIsLoading(false); };

        const updateNotifications = (newNotifs: Notification[], type: string) => {
             const deletedIds = getStoredIds(DELETED_NOTIFICATIONS_KEY);
             // Remove old notifs of this type and add new ones
             allNotifications = [
                ...allNotifications.filter(n => n.type !== type), 
                ...newNotifs
             ].filter(n => !deletedIds.includes(n.id));
             
             // Sort by date
             allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
             setNotifications([...allNotifications]);
        };

        // 1. Invitations Listener
        if(invitationsQuery) {
            activeListeners++;
            const unsubInvites = onSnapshot(invitationsQuery, (snapshot) => {
                const invites = snapshot.docs.map(doc => ({
                    id: doc.id,
                    type: 'invitation',
                    title: `Invitation from ${doc.data().fromAgencyName}`,
                    description: `Role: ${doc.data().role}. Click Accept to join.`,
                    timestamp: doc.data().createdAt?.toDate() || new Date(),
                    isRead: readIds.includes(doc.id),
                    // Zaroori Data:
                    fromAgencyId: doc.data().fromAgencyId,
                    fromAgencyName: doc.data().fromAgencyName,
                    role: doc.data().role,
                    email: doc.data().toEmail,
                    memberDocId: doc.data().memberDocId // <--- YE BOHOT ZAROORI HAI
                } as InvitationNotification));
                
                updateNotifications(invites, 'invitation');
                checkLoading();
            }, (err) => { console.error(err); checkLoading(); });
            unsubscribers.push(unsubInvites);
        }

        // ... (Keep Appointments, Followups, Activity listeners same as your original file) ...
        // Bas logic same rakhna updateNotifications wali.
        
        // Temporary fix to stop infinite loading if no queries run
        if (activeListeners === 0) setIsLoading(false);

        return () => unsubscribers.forEach(u => u());
    }, [canFetch, firestore, user, profile.agency_id, refreshKey]); // Removed complex dependencies
    
    
    // --- FIX 2: Accept Logic (Updates existing doc instead of creating new) ---
    const acceptInvitation = async (invitationId: string, agencyId: string, userId: string) => {
        const batch = writeBatch(firestore);
        
        // Local state se data uthao
        const invitationData = notifications.find(n => n.id === invitationId) as InvitationNotification;
        
        if (!invitationData) {
            console.error("Invitation data missing locally");
            throw new Error("Invitation not found");
        }
        
        // 1. Agency ke andar jo 'Pending' member hai, usay 'Active' karo
        // Note: Hum 'memberDocId' use kar rahe hain jo humne invite create karte waqt save kiya tha
        if (invitationData.memberDocId) {
            const memberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationData.memberDocId);
            batch.update(memberRef, {
                 status: 'Active',
                 user_id: userId, // Link actual User ID
                 joinedAt: new Date()
            });
        } else {
            // Fallback: Agar memberDocId nahi mila (purane invites ke liye), to naya bana lo
            const newMemberRef = doc(firestore, 'agencies', agencyId, 'teamMembers', userId);
            batch.set(newMemberRef, {
                name: user?.displayName || invitationData.email,
                email: invitationData.email,
                role: invitationData.role,
                status: 'Active',
                agency_id: agencyId,
                joinedAt: new Date()
            });
        }
        
        // 2. User ki apni profile update karo (Agency ID set karo)
        const userRef = doc(firestore, 'users', userId);
        batch.set(userRef, { 
            agency_id: agencyId,
            role: invitationData.role,
            agencyName: invitationData.fromAgencyName
        }, { merge: true });

        // 3. Invitation delete karo
        const invRef = doc(firestore, 'invitations', invitationId);
        batch.delete(invRef);
        
        try {
            await batch.commit();
            // Local state se bhi hatao
            deleteNotification(invitationId);
            // Page refresh taake naya agency data load ho jaye
            window.location.reload(); 
        } catch (error: any) {
            console.error("Accept Error:", error);
            // Permission Error ka check
            if (error.code === 'permission-denied') {
                throw new Error("Permission Denied: Check Firestore Rules for 'teamMembers' collection.");
            }
            throw error;
        }
    };

    const rejectInvitation = async (invitationId: string) => {
        // ... (Same logic as yours)
        const invRef = doc(firestore, 'invitations', invitationId);
        await deleteDoc(invRef);
        deleteNotification(invitationId);
    };

    return { notifications, isLoading, acceptInvitation, rejectInvitation, markAsRead, markAllAsRead, deleteNotification, forceRefresh };
};