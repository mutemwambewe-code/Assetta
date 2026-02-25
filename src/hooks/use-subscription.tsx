'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useUser } from '@/firebase';
import { UserProfile } from '@/lib/types';

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
  const { user, isUserLoading } = useUser();

  const subscription = useMemo<SubscriptionState>(() => {
    // Hardcoded to ACTIVE to remove all gating/billing requirements
    return {
      status: 'ACTIVE',
      plan: 'yearly',
      isTrial: false,
      isActive: true,
      isGated: false,
      isAdmin: true,
      trial_end_date: null,
      current_period_end: 'perpetual',
    };
  }, []);

  const value = {
    userProfile: user ? {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      phone: user.phoneNumber,
      role: 'ADMIN',
      trial_start_date: null,
      trial_end_date: null,
      subscription_status: 'ACTIVE',
      plan: 'yearly',
      current_period_end: 'perpetual'
    } as UserProfile : null,
    subscription,
    isLoading: isUserLoading,
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
