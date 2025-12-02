
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collectionGroup, query, where, onSnapshot, DocumentData, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { useMemoFirebase } from '@/firebase/hooks';

// DEPRECATED: This logic is now part of use-notifications.ts

export interface Invitation {
    id: string;
    agency_id: string;
    agency_name: string;
    email: string;
    role: 'Agent';
    status: 'Pending';
}

export const useInvitations = (userEmail: string | null | undefined) => {
    const firestore = useFirestore();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const invitationsQuery = useMemoFirebase(() => {
        if (userEmail && firestore) {
            return query(
                collectionGroup(firestore, 'teamMembers'), 
                where('email', '==', userEmail),
                where('status', '==', 'Pending')
            );
        }
        return null;
    }, [firestore, userEmail]);

    useEffect(() => {
        if (!invitationsQuery) {
            setIsLoading(false);
            setInvitations([]);
            return;
        }

        const unsubscribe = onSnapshot(
            invitationsQuery,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const fetchedInvitations = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Invitation[];
                
                setInvitations(fetchedInvitations);
                setIsLoading(false);
            },
            (error: FirestoreError) => {
                console.error("Error fetching invitations:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [invitationsQuery]);

    return { invitations, isLoading };
};
