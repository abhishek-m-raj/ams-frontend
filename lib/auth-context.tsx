"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { IncompleteProfileResponse, User } from "./types/UserTypes";

type AuthContextType = {
  session: unknown;
  user: User | null;
  incompleteProfile: IncompleteProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [user, setUser] = useState<User | null>(null);
  const [incompleteProfile, setIncompleteProfile] = useState<IncompleteProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    if (!session) {
      setUser(null);
      setIncompleteProfile(null);
      setIsLoading(false);
      
      // Redirect to signin if unauthenticated (except on public pages)
      const publicPaths = ['/', '/signin', '/signup'];
      if (!publicPaths.includes(pathname)) {
        router.push('/signin');
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });


      const responseData = await response.json();
      // Assign the user object directly
      let userData = responseData.data;
      if (response.status === 422 && responseData.data?.user) {
        setIncompleteProfile(responseData.data as IncompleteProfileResponse);
        // Flatten 422 response to match 200 response structure temporarily
        userData = {
          ...responseData.data.profile,
          ...responseData.data.user,
        };
      } else {
        setIncompleteProfile(null);
      }

      setUser(userData as User);

      if (response.status === 422) {
        // User needs to complete onboarding
        router.replace('/onboarding');
        return;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setIsLoading(false);
      setUser(null);
      setIncompleteProfile(null);
    }
  };

  useEffect(() => {
    if (!isPending) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  const value: AuthContextType = {
    session,
    user,
    incompleteProfile,
    isLoading: isPending || isLoading,
    error,
    refetchUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
