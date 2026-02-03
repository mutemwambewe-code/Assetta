
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';
import { useUser } from '@/firebase/provider';
import { format } from 'date-fns';
import { Loader2, ShieldCheck } from 'lucide-react';
import { SubscriptionPaywallModal } from '@/components/subscription/subscription-paywall-modal';

export function BillingSettings() {
    const { user } = useUser();
    const { subscription, loading } = useSubscription();
    const [showPaywall, setShowPaywall] = React.useState(false);

    if (loading) {
        return <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    // Calculate Trial Status if no active subscription
    let trialDaysLeft = 0;
    let isTrialing = false;

    if (!subscription || subscription.status !== 'active') {
        if (user?.metadata.creationTime) {
            const created = new Date(user.metadata.creationTime).getTime();
            const now = Date.now();
            const diff = (now - created) / (1000 * 3600 * 24);
            trialDaysLeft = Math.max(0, 30 - Math.ceil(diff));
            isTrialing = trialDaysLeft > 0;
        }
    }

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const isAdmin = user?.email && adminEmails.includes(user.email);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Subscription Status</CardTitle>
                            <CardDescription>Manage your Assetta Pro membership and billing details.</CardDescription>
                        </div>
                        {isAdmin && (
                            <Badge variant="outline" className="border-purple-500 text-purple-700 gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Admin Mode
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-1">
                            <p className="font-medium">Current Plan</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                    {subscription?.status === 'active' ? 'Assetta Pro' : 'Free Trial'}
                                </span>
                                {subscription?.status === 'active' || isAdmin ? (
                                    <Badge className="bg-green-600">Active {isAdmin ? '(Admin)' : ''}</Badge>
                                ) : isTrialing ? (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">{trialDaysLeft} Days Left</Badge>
                                ) : (
                                    <Badge variant="destructive">Expired</Badge>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="font-medium">ZMW 150 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                        </div>
                    </div>

                    {!subscription || subscription.status !== 'active' ? (
                        <div className="bg-yellow-50 border-yellow-200 border p-4 rounded-md text-sm text-yellow-800">
                            <p className="font-semibold mb-1">Upgrade to Pro</p>
                            <p>Unlock unlimited properties, ZRA Tax Hub, and Lease Generation.</p>
                            <Button className="mt-3 w-full sm:w-auto" onClick={() => setShowPaywall(true)}>
                                Subscribe Now via Mobile Money
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Next billing date: <span className="font-medium text-foreground">{format(new Date(subscription.currentPeriodEnd), 'PPP')}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Recent transactions via Lenco Pay.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground italic text-center py-4">
                        No recent transactions found.
                    </div>
                </CardContent>
            </Card>
            <SubscriptionPaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
        </div>
    );
}
