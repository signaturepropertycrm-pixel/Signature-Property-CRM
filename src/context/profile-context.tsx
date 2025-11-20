
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

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: firestoreProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  const [profile, setProfileState] = useState<ProfileData>(defaultProfile);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
        try {
            const savedProfile = localStorage.getItem('app-profile');
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile);
                setProfileState(parsedProfile);
            }
        } catch (error) {
            console.error("Failed to parse profile from localStorage", error);
        }
        setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (firestoreProfile) {
        const newProfileData: ProfileData = {
            agencyName: firestoreProfile.agencyName || profile.agencyName || 'My Agency',
            ownerName: firestoreProfile.name || user?.displayName || 'User',
            phone: firestoreProfile.phone || '',
            // Important: Prioritize Firestore role, then local state, then default.
            role: firestoreProfile.role || profile.role || 'Agent', 
            avatar: user?.photoURL || firestoreProfile.avatar || '',
            user_id: firestoreProfile.id,
            agency_id: firestoreProfile.agency_id,
        };
        setProfileState(newProfileData);
        try {
            localStorage.setItem('app-profile', JSON.stringify(newProfileData));
        } catch (error) {
            console.error("Failed to save profile to localStorage", error);
        }
    }
  }, [firestoreProfile, user]);

  const setProfile = (newProfile: Partial<ProfileData>) => {
    const updatedProfile = { ...profile, ...newProfile };
    setProfileState(updatedProfile);
    try {
        localStorage.setItem('app-profile', JSON.stringify(updatedProfile));
    } catch (error) {
        console.error("Failed to save profile to localStorage", error);
    }
  };

  const isLoading = isAuthLoading || isProfileLoading || !isInitialized;

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
