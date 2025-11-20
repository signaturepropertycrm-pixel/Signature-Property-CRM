
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

// Define the shape of the hook's return value
export interface UserAuthHookResult {
  user: User | null;
  isUserLoading: boolean; // Renamed for clarity, was 'initializing'
  userError: Error | null;    // Renamed for clarity, was 'error'
}

/**
 * A hook to get the current authenticated user from Firebase.
 *
 * This hook subscribes to Firebase's authentication state changes.
 * It provides the current user object, a loading state, and any potential error.
 *
 * @returns {UserAuthHookResult} An object containing the user, loading state, and error.
 */
export function useUser(): UserAuthHookResult {
  const auth = useAuth(); // Get the auth instance from context

  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // If auth service is not available, we are not loading and there's no user.
    if (!auth) {
      setIsUserLoading(false);
      setUser(null);
      return;
    }

    // Subscribe to the authentication state change observer
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsUserLoading(false);
      },
      (error) => {
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Re-run the effect if the auth instance changes

  return { user, isUserLoading, userError };
}

