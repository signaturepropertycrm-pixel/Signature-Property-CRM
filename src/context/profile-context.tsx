
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
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc<any>(userDocRef);

  const agencyDocRef = useMemoFirebase(() => (userProfile?.agency_id ? doc(firestore, 'agencies', userProfile.agency_id) : null), [userProfile, firestore]);
  const { data: agencyProfile, isLoading: isAgencyLoading } = useDoc<any>(agencyDocRef);
  
  const agentDocRef = useMemoFirebase(() => (userProfile?.role === 'Agent' && user ? doc(firestore, 'agents', user.uid) : null), [userProfile, user, firestore]);
  const { data: agentProfile, isLoading: isAgentProfileLoading } = useDoc<any>(agentDocRef);


  const [profile, setProfileState] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
        setProfileState(defaultProfile);
        localStorage.removeItem('app-profile');
        return;
    }

    // Set initial data from auth user to avoid flicker
    setProfileState(prev => ({
        ...prev,
        user_id: user.uid,
        name: user.displayName || prev.name || 'User',
        avatar: user.photoURL || prev.avatar,
    }));

    if (!isUserProfileLoading && userProfile) {
        const role = userProfile.role || 'Agent';
        
        let name = userProfile.name || user.displayName || 'User';
        let phone = userProfile.phone || '';
        // Prioritize the avatar from the specific profile documents (agent/agency) over the general user profile or auth object
        let avatar = agentProfile?.avatar || agencyProfile?.avatar || userProfile.avatar || user.photoURL || '';

        // Specific profiles can override details
        if (role === 'Agent' && agentProfile) {
            name = agentProfile.name || name;
            phone = agentProfile.phone || phone;
        } else if ((role === 'Admin' || role === 'Editor') && agencyProfile) {
            name = agencyProfile.name || name;
            phone = agencyProfile.phone || phone;
        }

        const newProfileData: ProfileData = {
            name: name,
            agencyName: agencyProfile?.agencyName || 'My Agency',
            phone: phone,
            role: role, 
            avatar: avatar,
            user_id: user.uid,
            agency_id: userProfile.agency_id || '',
        };
        
        setProfileState(newProfileData);
        localStorage.setItem('app-profile', JSON.stringify(newProfileData));
    }
  }, [user, userProfile, agencyProfile, agentProfile, isAuthLoading, isUserProfileLoading, isAgencyLoading, isAgentProfileLoading]);


  const setProfile = (newProfile: Partial<ProfileData>) => {
    setProfileState(prevProfile => {
        const updatedProfile = { ...prevProfile, ...newProfile };
        localStorage.setItem('app-profile', JSON.stringify(updatedProfile));
        return updatedProfile;
    });
  };

  const isLoading = isAuthLoading || isUserProfileLoading || (!!userProfile?.agency_id && isAgencyLoading);

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
