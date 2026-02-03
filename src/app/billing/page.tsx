'use client';

import { useUser } from '@/firebase/provider';
import { LencoPayment } from '@/components/billing/LencoPayment';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function BillingPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="container max-w-4xl mx-auto py-20 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">Upgrade to Assetta Pro</h1>
                <p className="text-muted-foreground text-lg">Manage your properties with professional tools.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">

                {/* Free Plan (Context) */}
                <Card className="border-border/50 bg-secondary/20">
                    <CardHeader>
                        <CardTitle>Free Trial</CardTitle>
                        <CardDescription>Get started with basic features.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-6">K0 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Property</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Basic Reporting</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 30 Days Access</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="border-primary shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                        POPULAR
                    </div>
                    <CardHeader>
                        <CardTitle>Pro Plan</CardTitle>
                        <CardDescription>Unlock everything you need to scale.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-6">K250 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited Properties</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced Financial Reports</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Automated SMS Reminders</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Tax Helper</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <LencoPayment
                            amount={250}
                            email={user?.email || ''}
                            className="w-full"
                        />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
