
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemoFirebase } from '@/firebase/hooks';


export interface ProfileData {
  agencyName: string;
  ownerName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  user_id: string;
  agency_id: string;
}

interface ProfileContextType {
  profile: ProfileData;
  setProfile: (profile: Partial<ProfileData>) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultProfile: ProfileData = {
    agencyName: 'My Agency',
    ownerName: 'New User',
    phone: '',
    role: 'Agent',
    avatar: '',
    user_id: '',
    agency_id: '',
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // This hook now correctly points to the user's own profile document
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: firestoreProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  // This will try to get the full agency document for any user who has an agency_id
  const agencyDocRef = useMemoFirebase(() => (firestoreProfile?.agency_id ? doc(firestore, 'agencies', firestoreProfile.agency_id) : null), [firestoreProfile, firestore]);
  const { data: agencyProfile, isLoading: isAgencyLoading } = useDoc<any>(agencyDocRef);
  

  const [profile, setProfileState] = useState<ProfileData>(defaultProfile);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load profile from localStorage on initial mount
  useEffect(() => {
    if (!isInitialized) {
        try {
            const savedProfile = localStorage.getItem('app-profile');
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile);
                // Ensure there's at least a default role if localStorage is somehow malformed
                if (!parsedProfile.role) parsedProfile.role = 'Agent';
                setProfileState(parsedProfile);
            }
        } catch (error) {
            console.error("Failed to parse profile from localStorage", error);
        }
        setIsInitialized(true);
    }
  }, [isInitialized]);

  // Effect to update profile state when firestore data changes
  useEffect(() => {
    if (firestoreProfile) {
        const newProfileData: ProfileData = {
            agencyName: agencyProfile?.name || profile.agencyName || 'My Agency',
            ownerName: firestoreProfile.name || user?.displayName || 'User',
            phone: firestoreProfile.phone || '',
            role: firestoreProfile.role || profile.role || 'Agent', 
            avatar: user?.photoURL || firestoreProfile.avatar || '',
            user_id: firestoreProfile.id,
            agency_id: firestoreProfile.agency_id, // This is CRITICAL
        };
        
        // Prevent setting state if data is identical to avoid loops
        if (JSON.stringify(newProfileData) !== JSON.stringify(profile)) {
            setProfileState(newProfileData);
            try {
                localStorage.setItem('app-profile', JSON.stringify(newProfileData));
            } catch (error) {
                console.error("Failed to save profile to localStorage", error);
            }
        }
    }
  }, [firestoreProfile, agencyProfile, user, profile]);

  const setProfile = (newProfile: Partial<ProfileData>) => {
    setProfileState(prevProfile => {
        const updatedProfile = { ...prevProfile, ...newProfile };
        try {
            localStorage.setItem('app-profile', JSON.stringify(updatedProfile));
        } catch (error) {
            console.error("Failed to save profile to localStorage", error);
        }
        return updatedProfile;
    });
  };

  const isLoading = isAuthLoading || isProfileLoading || isAgencyLoading || !isInitialized;

  return (
    <ProfileContext.Provider value={{ profile, setProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
