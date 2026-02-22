
import { useUser } from '@/firebase/provider';
import { useSubscription } from '@/hooks/use-subscription';

export const useSubscriptionGate = () => {
    const { user } = useUser();
    const { subscription, isLoading: loading } = useSubscription();

    const checkAccess = (feature: 'tax' | 'leases' | 'reports' | 'core') => {
        // 1. ADMIN BYPASS (Critical Rule 4) - Check hook's isAdmin state
        if (subscription.isAdmin) return true;

        // 2. TRIAL LOGIC - Check hook's isTrial state
        if (subscription.isTrial) return true;

        // 3. SUBSCRIPTION CHECK
        if (loading) return false; // Fail safe

        // Check if subscription is active
        const isActive = subscription.isActive || subscription.status === 'ACTIVE';

        // 4. PLAN LEVEL ALIGNMENT
        // If we have specific plan requirements in the future, we can add them here.
        // For now, any active subscription or trial has access to core features.
        if (feature === 'tax' && subscription.plan === null) return false;

        return isActive;
    };

    return { canAccess: checkAccess, loading, subscription };
};
