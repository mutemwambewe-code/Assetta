import { useSubscription } from '@/hooks/use-subscription';
import { useCallback } from 'react';

export const useSubscriptionGate = () => {
    const { subscription, isLoading: loading } = useSubscription();

    const checkAccess = useCallback((feature: 'tax' | 'leases' | 'reports' | 'core') => {
        // 1. ADMIN BYPASS (Critical Rule 4) - Check hook's isAdmin state
        if (subscription.isAdmin) return true;

        // 2. TRIAL LOGIC - Check hook's isTrial state
        if (subscription.isTrial) return true;

        // 3. SUBSCRIPTION CHECK
        if (loading) return false; // Fail safe

        // Check if subscription is active
        const isActive = subscription.isActive;

        // 4. PLAN LEVEL ALIGNMENT
        // For now, any active subscription or trial has access to core features.
        if (feature === 'tax' && subscription.plan === null) return false;

        return isActive;
    }, [subscription, loading]);

    return { canAccess: checkAccess, loading, subscription };
};
