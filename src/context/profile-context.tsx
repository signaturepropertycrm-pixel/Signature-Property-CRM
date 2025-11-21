
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemoFirebase } from '@/firebase/hooks';


export interface ProfileData {
  name: string;
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
    name: 'New User',
    agencyName: 'My Agency',
    ownerName: 'Admin',
    phone: '',
    role: 'Agent',
    avatar: '',
    user_id: '',
    agency_id: '',
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // This hook now correctly points to the user's own profile document in the 'users' collection
  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<any>(userDocRef);

  // This will try to get the full agency document for any user who has an agency_id
  const agencyDocRef = useMemoFirebase(() => (userProfile?.agency_id ? doc(firestore, 'agencies', userProfile.agency_id) : null), [userProfile, firestore]);
  const { data: agencyProfile, isLoading: isAgencyLoading } = useDoc<any>(agencyDocRef);
  
  // This will get the agent's specific profile data from the 'agents' collection if their role is Agent
  const agentDocRef = useMemoFirebase(() => (userProfile?.role === 'Agent' ? doc(firestore, 'agents', user.uid) : null), [userProfile, user, firestore]);
  const { data: agentProfile, isLoading: isAgentProfileLoading } = useDoc<any>(agentDocRef);


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
    if (userProfile) { // We need the base user profile first to determine the role
        const role = userProfile.role || 'Agent';

        let name = user?.displayName || userProfile.name || 'User';
        if (role === 'Agent' && agentProfile?.name) {
            name = agentProfile.name; // Prioritize name from agents collection for agents
        }

        const newProfileData: ProfileData = {
            name: name,
            agencyName: agencyProfile?.name || profile.agencyName || 'My Agency',
            ownerName: agencyProfile?.ownerName || 'Admin', // This is for the agency, not the agent
            phone: userProfile.phone || '',
            role: role, 
            avatar: agentProfile?.avatar || userProfile.avatar || user?.photoURL || '',
            user_id: userProfile.id,
            agency_id: userProfile.agency_id,
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
  }, [userProfile, agencyProfile, agentProfile, user, profile]);

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

  const isLoading = isAuthLoading || isUserProfileLoading || isAgencyLoading || isAgentProfileLoading || !isInitialized;

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
