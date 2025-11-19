
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
    agencyName: 'Signature Properties',
    ownerName: 'Demo Admin',
    phone: '+92 300 1234567',
    role: 'Admin', // Default role is Admin
    avatar: 'https://images.unsplash.com/photo-1590086782792-42dd2350140d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjIxODcyNzB8MA&ixlib=rb-4.1.0&q=80&w=1080'
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
