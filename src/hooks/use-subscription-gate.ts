import { useSubscription } from '@/hooks/use-subscription';

export const useSubscriptionGate = () => {
    const { subscription, isLoading: loading } = useSubscription();

    const checkAccess = (feature: 'tax' | 'leases' | 'reports' | 'core') => {
        // Always allow access as billing logic is removed
        return true;
    };

    return { canAccess: checkAccess, loading, subscription };
};
