

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useAuth } from '@/firebase/provider';
import { collection, collectionGroup, query, where, onSnapshot, doc, writeBatch, deleteDoc, DocumentData, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { useProfile } from '@/context/profile-context';
import { useMemoFirebase } from '@/firebase/hooks';
import type { Notification, InvitationNotification, AppointmentNotification, FollowUpNotification, UserRole, Appointment, FollowUp } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { isBefore, sub, isAfter, isToday, parseISO, startOfToday } from 'date-fns';

const NOTIFICATION_READ_STATUS_KEY = 'signaturecrm_read_notifications';

export const useNotifications = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { profile } = useProfile();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
    }, [firestore, user?.email]);

    const appointmentsQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'appointments') : null, [canFetch, firestore, profile.agency_id]);
    const followUpsQuery = useMemoFirebase(() => canFetch ? collection(firestore, 'agencies', profile.agency_id, 'followUps') : null, [canFetch, firestore, profile.agency_id]);

    const getReadStatus = (): string[] => {
        try {
            const saved = localStorage.getItem(NOTIFICATION_READ_STATUS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    };
    
    const markAsRead = (notificationId: string) => {
        const readIds = getReadStatus();
        if (!readIds.includes(notificationId)) {
            const newReadIds = [...readIds, notificationId];
            localStorage.setItem(NOTIFICATION_READ_STATUS_KEY, JSON.stringify(newReadIds));
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        }
    };

    useEffect(() => {
        if (!canFetch) {
            setIsLoading(false);
            return;
        }
        
        const readIds = getReadStatus();
        const unsubscribers: (() => void)[] = [];
        let allNotifications: Notification[] = [];
        let loadingStates = { invitations: true, appointments: true, followups: true };
        const updateLoading = () => setIsLoading(Object.values(loadingStates).some(s => s));

        const updateAndSortNotifications = () => {
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
                
                allNotifications = [...allNotifications.filter(n => n.type !== 'invitation'), ...invitationNotifications];
                updateAndSortNotifications();
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

        // Appointments
        if(appointmentsQuery) {
             const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
                const now = new Date();
                const dayAhead = sub(now, { days: -1 });
                const hourAhead = sub(now, { hours: -1 });
                const fifteenMinutesAhead = sub(now, { minutes: -15 });

                const appointmentNotifications: AppointmentNotification[] = [];

                snapshot.docs.forEach(doc => {
                    const appt = { id: doc.id, ...doc.data() } as Appointment;
                    if (appt.status !== 'Scheduled') return;

                    const apptDateTime = new Date(`${appt.date}T${appt.time}`);
                    
                    const checkAndAddReminder = (reminderType: 'day' | 'hour' | 'minute', boundary: Date, title: string) => {
                        const id = `${appt.id}-${reminderType}`;
                        if (isAfter(apptDateTime, now) && isBefore(apptDateTime, boundary) && !allNotifications.some(n => n.id === id)) {
                             appointmentNotifications.push({
                                id,
                                type: 'appointment',
                                title,
                                description: `With ${appt.contactName} at ${appt.time}`,
                                timestamp: new Date(),
                                isRead: readIds.includes(id),
                                appointment: appt,
                                reminderType
                            });
                        }
                    };

                    checkAndAddReminder('day', dayAhead, 'Appointment in 24 hours');
                    checkAndAddReminder('hour', hourAhead, 'Appointment in 1 hour');
                    checkAndAddReminder('minute', fifteenMinutesAhead, 'Appointment in 15 minutes');
                });
                
                allNotifications = [...allNotifications.filter(n => n.type !== 'appointment'), ...appointmentNotifications];
                updateAndSortNotifications();
                loadingStates.appointments = false;
                updateLoading();
            });
            unsubscribers.push(unsubAppointments);
        } else {
             loadingStates.appointments = false;
        }

        // Follow-ups
        if(followUpsQuery) {
            const unsubFollowUps = onSnapshot(followUpsQuery, (snapshot) => {
                const followUpNotifications: FollowUpNotification[] = [];
                snapshot.docs.forEach(doc => {
                    const followUp = { id: doc.id, ...doc.data() } as FollowUp;
                    if (followUp.status !== 'Scheduled') return;

                    const reminderDate = parseISO(followUp.nextReminder);
                    if (isToday(reminderDate) || isBefore(reminderDate, startOfToday())) {
                        followUpNotifications.push({
                            id: followUp.id,
                            type: 'followup',
                            title: 'Follow-up Due Today',
                            description: `Follow up with ${followUp.buyerName}.`,
                            timestamp: reminderDate,
                            isRead: readIds.includes(followUp.id),
                            followUp: followUp
                        });
                    }
                });

                allNotifications = [...allNotifications.filter(n => n.type !== 'followup'), ...followUpNotifications];
                updateAndSortNotifications();
                loadingStates.followups = false;
                updateLoading();
            });
            unsubscribers.push(unsubFollowUps);
        } else {
            loadingStates.followups = false;
        }

        updateLoading();

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [canFetch, firestore, user, profile.agency_id]);
    
    
    const acceptInvitation = async (invitationId: string, agencyId: string, userId: string) => {
        const batch = writeBatch(firestore);
        const invRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationId);
        batch.update(invRef, { status: 'Active', id: userId });

        const userRef = doc(firestore, 'users', userId);
        batch.update(userRef, { agency_id: agencyId });

        await batch.commit().catch((error) => {
            throw new FirestorePermissionError({ operation: 'write', path: `batch write for invitation` });
        });
        setNotifications(prev => prev.filter(n => n.id !== invitationId));
    };

    const rejectInvitation = async (invitationId: string, agencyId: string) => {
        const invRef = doc(firestore, 'agencies', agencyId, 'teamMembers', invitationId);
        await deleteDoc(invRef).catch((error) => {
            throw new FirestorePermissionError({ operation: 'delete', path: invRef.path });
        });
        setNotifications(prev => prev.filter(n => n.id !== invitationId));
    };


    return { notifications, isLoading, acceptInvitation, rejectInvitation, markAsRead };
};
