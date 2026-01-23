'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc } from 'firebase/firestore';
import { User, onIdTokenChanged } from 'firebase/auth';
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
}

interface SubscriptionContextType {
  userProfile: UserProfile | null;
  subscription: SubscriptionState;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading: isAuthLoading, auth } = useUser();
  const firestore = useFirestore();

  const userProfileCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const userProfileRef = useMemoFirebase(
    () => (user && userProfileCollection ? doc(userProfileCollection, user.uid) : null),
    [user, userProfileCollection]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const onSignup = useCallback(async (newUser: User) => {
    if (!userProfileCollection) return;
    const userProfileRef = doc(userProfileCollection, newUser.uid);

    const thirtyDaysFromNow = addDays(new Date(), 30);

    const newUserProfile: UserProfile = {
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.displayName,
      phone: newUser.phoneNumber,
      role: 'ADMIN', // Assign ADMIN role on signup
      trial_start_date: new Date().toISOString(),
      trial_end_date: thirtyDaysFromNow.toISOString(),
      subscription_status: 'TRIAL',
      plan: null,
      current_period_end: null,
    };
    await setDoc(userProfileRef, newUserProfile);
  }, [userProfileCollection]);
  
  useEffect(() => {
    if (!auth) return;
    const unsub = onIdTokenChanged(auth, async (newUser) => {
        if (newUser) {
            const metadata = newUser.metadata;
            if (metadata.creationTime === metadata.lastSignInTime) {
                await onSignup(newUser);
            }
        }
    });
    return () => unsub();
  }, [auth, onSignup]);

  const subscription = useMemo<SubscriptionState>(() => {
    if (!userProfile) {
      return { status: null, plan: null, isTrial: false, isActive: false, isGated: true, trial_end_date: null, current_period_end: null };
    }
    
    if (userProfile.role === 'ADMIN') {
        return { status: 'ACTIVE', plan: 'yearly', isTrial: false, isActive: true, isGated: false, trial_end_date: null, current_period_end: null };
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
    const isGated = !isTrial && !isActive;

    return {
      status,
      plan: userProfile.plan,
      isTrial,
      isActive,
      isGated,
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
