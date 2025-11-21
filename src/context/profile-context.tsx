
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
    name: '',
    agencyName: '',
    ownerName: '',
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
    if (isAuthLoading) return; // Wait for auth to settle

    if (userProfile) { // We need the base user profile first to determine the role
        const role = userProfile.role || 'Agent';

        let name = user?.displayName || userProfile.name || 'User';
        let avatar = user?.photoURL || userProfile.avatar || '';

        // If the role is agent, prioritize the name from the more detailed agent profile
        if (role === 'Agent' && agentProfile) {
            name = agentProfile.name || name;
            avatar = agentProfile.avatar || avatar;
        } else if (role === 'Admin' && agencyProfile) {
            // For admin, the main name is the owner name from the agency doc
            name = agencyProfile.ownerName || name;
            avatar = agencyProfile.avatar || avatar;
        }

        const newProfileData: ProfileData = {
            name: name,
            agencyName: agencyProfile?.name || 'My Agency',
            ownerName: agencyProfile?.ownerName || 'Admin',
            phone: agentProfile?.phone || userProfile.phone || '',
            role: role, 
            avatar: avatar,
            user_id: user?.uid || '',
            agency_id: userProfile.agency_id || '',
        };
        
        setProfileState(newProfileData);
        localStorage.setItem('app-profile', JSON.stringify(newProfileData));
    } else if (!isUserProfileLoading && !userProfile) {
        // Handle case where user doc doesn't exist but user is logged in
        // This could be a new user who just signed up
        const localProfile = localStorage.getItem('app-profile');
        if (localProfile) {
            setProfileState(JSON.parse(localProfile));
        }
    }
  }, [userProfile, agencyProfile, agentProfile, user, isAuthLoading, isUserProfileLoading]);

  const setProfile = (newProfile: Partial<ProfileData>) => {
    setProfileState(prevProfile => {
        const updatedProfile = { ...prevProfile, ...newProfile };
        localStorage.setItem('app-profile', JSON.stringify(updatedProfile));
        return updatedProfile;
    });
  };

  const isLoading = isAuthLoading || isUserProfileLoading || (!!userProfile?.agency_id && isAgencyLoading) || (userProfile?.role === 'Agent' && isAgentProfileLoading);

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
