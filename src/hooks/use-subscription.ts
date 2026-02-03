
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase/provider';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Subscription } from '@/lib/types';

export function useSubscription() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        async function setupSubscription() {
            if (!user?.uid || !firestore) {
                setLoading(false);
                return;
            }

            try {
                const subRef = collection(firestore, 'users', user.uid, 'subscriptions');
                const q = query(
                    subRef,
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    if (!snapshot.empty) {
                        const subData = snapshot.docs[0].data() as Subscription;
                        setSubscription({ ...subData, id: snapshot.docs[0].id });
                    } else {
                        setSubscription(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching subscription:", error);
                    setLoading(false);
                });
            } catch (err) {
                console.error("Subscription setup error", err);
                setLoading(false);
            }
        }

        setupSubscription();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user?.uid, firestore]);

    return { subscription, loading };
}
