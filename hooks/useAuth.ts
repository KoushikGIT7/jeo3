/**
 * useAuth Hook - Single source of truth for authentication state
 * Ensures role is resolved before allowing navigation
 */

import { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange } from '../services/auth';
import { UserProfile } from '../types';

interface UseAuthReturn {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  role: UserProfile['role'] | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    // Auth state listener
    const unsubscribe = onAuthStateChange(async (firebaseUser, userProfile) => {
      if (!isMountedRef.current) return;

      // Clear any pending timeout
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
        profileTimeoutRef.current = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        // onAuthStateChange should always provide a profile for authenticated users
        // (either from Firestore or a fallback). Accept it even if null temporarily.
        setProfile(userProfile);
        // Only set loading to false once we have a profile
        // This ensures routing waits for profile to be ready
        if (userProfile) {
          setLoading(false);
        } else {
          // SAFEGUARD: If profile is null but user exists, wait a bit then set loading false
          // This handles edge cases where profile fetch is delayed (shouldn't happen but safety net)
          console.warn('⚠️ useAuth: User exists but profile is null, waiting for profile...');
          profileTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.warn('⚠️ useAuth: Profile still null after timeout, setting loading=false');
              setLoading(false);
            }
          }, 2000);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current);
      }
      unsubscribe();
    };
  }, []); // Empty dependency array - run only once

  // Derive role from profile
  const role = profile?.role || null;

  return {
    user,
    profile,
    loading,
    role
  };
};
