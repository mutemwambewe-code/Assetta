'use client';

import { BillingClient } from '@/components/billing/billing-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function BillingPage() {
    const router = useRouter();
    return (
        <div className="max-w-4xl mx-auto grid gap-6 py-8 px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
                    <p className="text-muted-foreground">Manage your subscription and view payment history.</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>
            <BillingClient />
        </div>
    );
}

BillingPage.title = "Billing";
export default BillingPage;
