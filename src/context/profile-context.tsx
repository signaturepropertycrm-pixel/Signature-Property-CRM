
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ProfileData {
  agencyName: string;
  ownerName: string;
  phone: string;
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
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('app-profile');
      if (savedProfile) {
        setProfileState(JSON.parse(savedProfile));
      }
    } catch (error) {
        console.error("Failed to parse profile from localStorage", error);
        setProfileState(defaultProfile);
    }
  }, []);

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
