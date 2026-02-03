
import { useUser } from '@/firebase/provider';
import { useSubscription } from '@/hooks/use-subscription';

export const useSubscriptionGate = () => {
    const { user } = useUser();
    const { subscription, loading } = useSubscription();

    const checkAccess = (feature: 'tax' | 'leases' | 'reports' | 'core') => {
        // 1. ADMIN BYPASS (Critical Rule 4) - Whitelisted in .env
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
        if (user?.email && adminEmails.includes(user.email)) return true;

        // 2. TRIAL LOGIC
        // Assuming createdAt is accessible on User object or Metadata. 
        // Firebase User object has metadata.creationTime
        if (user?.metadata.creationTime) {
            const trialDays = 30;
            const creationTime = new Date(user.metadata.creationTime).getTime();
            const now = new Date().getTime();
            const diffDays = (now - creationTime) / (1000 * 3600 * 24);

            if (diffDays < trialDays) return true;
        }

        // 3. SUBSCRIPTION CHECK
        if (loading) return false; // Fail safe

        // Check if subscription is active
        const isActive = subscription?.status === 'active';

        // 4. PLAN LEVEL ALIGNMENT
        if (feature === 'tax' && subscription?.plan !== 'pro') return false;

        return isActive;
    };

    return { canAccess: checkAccess, loading, subscription };
};
