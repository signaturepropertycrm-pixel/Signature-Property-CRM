
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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
  setProfile: (profile: ProfileData) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultProfile: ProfileData = {
    agencyName: 'My Agency',
    ownerName: 'New User',
    phone: '',
    role: 'Agent', // Default to the most restrictive role
    avatar: '',
    user_id: '',
    agency_id: '',
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // Reference to the user's document in Firestore, memoized to prevent re-renders
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: firestoreProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

  const [profile, setProfileState] = useState<ProfileData>(defaultProfile);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Try to load from localStorage first for faster initial UI render
    if (!isInitialized) {
        try {
            const savedProfile = localStorage.getItem('app-profile');
            if (savedProfile) {
                setProfileState(JSON.parse(savedProfile));
            }
        } catch (error) {
            console.error("Failed to parse profile from localStorage", error);
        }
        setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    // Once Firestore data is loaded, it becomes the source of truth
    if (firestoreProfile) {
        const newProfileData: ProfileData = {
            agencyName: firestoreProfile.agencyName || profile.agencyName, // Keep local agencyName if not in firestore
            ownerName: firestoreProfile.name || 'User',
            phone: firestoreProfile.phone || '',
            role: firestoreProfile.role || profile.role || 'Agent',
            avatar: user?.photoURL || firestoreProfile.avatar || '',
            user_id: firestoreProfile.id,
            agency_id: firestoreProfile.agency_id,
        };
        setProfileState(newProfileData);
        localStorage.setItem('app-profile', JSON.stringify(newProfileData));
    }
  }, [firestoreProfile, user, profile.agencyName, profile.role]);

  const setProfile = (newProfile: ProfileData) => {
    setProfileState(newProfile);
    try {
        localStorage.setItem('app-profile', JSON.stringify(newProfile));
    } catch (error) {
        console.error("Failed to save profile to localStorage", error);
    }
  };

  const isLoading = isAuthLoading || isProfileLoading;

  return (
    <ProfileContext.Provider value={{ profile, setProfile, isLoading }}>
      {isLoading ? (
          <div className="flex h-screen w-full items-center justify-center">
              <p>Loading Profile...</p>
          </div>
      ) : children}
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
