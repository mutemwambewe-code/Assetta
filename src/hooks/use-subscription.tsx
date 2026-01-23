'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { addDays, isAfter } from 'date-fns';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_status: 'TRIAL' | 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' | null;
  plan: 'monthly' | 'yearly' | null;
  current_period_end: string | null;
}

interface SubscriptionState {
  status: UserProfile['subscription_status'];
  plan: UserProfile['plan'];
  trial_end_date: string | null;
  current_period_end: string | null;
  isTrial: boolean;
  isActive: boolean;
  isGated: boolean;
  isAdmin: boolean;
}

interface SubscriptionContextType {
  userProfile: UserProfile | null;
  subscription: SubscriptionState;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const onSignup = useCallback(async (newUser: User) => {
    if (!firestore) return;
    const userProfileDocRef = doc(firestore, 'users', newUser.uid);

    const docSnap = await getDoc(userProfileDocRef);
    if (docSnap.exists()) {
      return;
    }

    const thirtyDaysFromNow = addDays(new Date(), 30);

    const newUserProfile: UserProfile = {
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.displayName,
      phone: newUser.phoneNumber,
      role: 'USER', // Default role is USER
      trial_start_date: new Date().toISOString(),
      trial_end_date: thirtyDaysFromNow.toISOString(),
      subscription_status: 'TRIAL',
      plan: null,
      current_period_end: null,
    };
    await setDoc(userProfileDocRef, newUserProfile);
  }, [firestore]);
  
  useEffect(() => {
    if (user && !isProfileLoading && !userProfile) {
      onSignup(user);
    }
  }, [user, isProfileLoading, userProfile, onSignup]);

  const subscription = useMemo<SubscriptionState>(() => {
    const defaultState = {
        status: null,
        plan: null,
        isTrial: false,
        isActive: false,
        isGated: true,
        isAdmin: false,
        trial_end_date: null,
        current_period_end: null,
    };

    if (!userProfile) return defaultState;

    // Admin check is the highest priority
    if (userProfile.role === 'ADMIN') {
        return {
            ...defaultState,
            status: 'ACTIVE',
            plan: 'yearly', // Or some other admin identifier
            isActive: true,
            isGated: false,
            isAdmin: true,
            current_period_end: 'perpetual',
        };
    }

    let status = userProfile.subscription_status;
    
    // If user is in trial, check if it has expired
    if (status === 'TRIAL') {
      const trialEndDate = userProfile.trial_end_date ? new Date(userProfile.trial_end_date) : new Date(0);
      if (isAfter(new Date(), trialEndDate)) {
        status = 'INACTIVE'; // Trial has expired
      }
    }
    
    const isTrial = status === 'TRIAL';
    const isActive = status === 'ACTIVE';
    // Gated if not admin, not in trial, and not active
    const isGated = !isTrial && !isActive;

    return {
      status,
      plan: userProfile.plan,
      isTrial,
      isActive,
      isGated,
      isAdmin: false,
      trial_end_date: userProfile.trial_end_date,
      current_period_end: userProfile.current_period_end,
    };
  }, [userProfile]);
  
  const isLoading = isAuthLoading || (!!user && isProfileLoading);

  const value = {
    userProfile: userProfile ?? null,
    subscription,
    isLoading,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
