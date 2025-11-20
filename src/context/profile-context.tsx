
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { useUser } from '@/firebase';

export interface ProfileData {
  agencyName: string;
  ownerName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

interface ProfileContextType {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultProfile: ProfileData = {
    agencyName: 'My Agency',
    ownerName: 'New User',
    phone: '',
    role: 'Admin', // Default role is Admin
    avatar: ''
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [profile, setProfileState] = useState<ProfileData>(() => {
    // Initialize from localStorage synchronously
    try {
      const savedProfile = localStorage.getItem('app-profile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (!parsedProfile.role) parsedProfile.role = 'Admin';
        return parsedProfile;
      }
    } catch (error) {
      console.error("Failed to parse profile from localStorage", error);
    }
    return defaultProfile;
  });

  useEffect(() => {
    // Update profile context when Firebase user changes
    if (user) {
      setProfileState(prevProfile => ({
        ...prevProfile,
        ownerName: user.displayName || prevProfile.ownerName,
        avatar: user.photoURL || prevProfile.avatar,
      }));
    }
  }, [user]);

  const setProfile = (newProfile: ProfileData) => {
    setProfileState(newProfile);
    try {
        localStorage.setItem('app-profile', JSON.stringify(newProfile));
    } catch (error) {
        console.error("Failed to save profile to localStorage", error);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
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
