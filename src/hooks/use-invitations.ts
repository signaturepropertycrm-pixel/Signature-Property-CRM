
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, onSnapshot, DocumentData, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/hooks';

export interface Invitation {
    id: string;
    fromAgencyId: string;   // Changed from agency_id
    fromAgencyName: string; // Changed from agency_name
    toEmail: string;        // Changed from email
    role: 'Agent';
    status: 'pending' | 'Pending'; // Allow both cases
    memberDocId: string;    // Reference to the agency doc
}

export const useInvitations = (userEmail: string | null | undefined) => {
    const firestore = useFirestore();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const invitationsQuery = useMemoFirebase(() => {
        if (userEmail && firestore) {
            // FIX: Check for both 'pending' and 'Pending' to catch all cases.
            return query(
                collection(firestore, 'invitations'), 
                where('toEmail', '==', userEmail),
                where('status', 'in', ['pending', 'Pending'])
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
