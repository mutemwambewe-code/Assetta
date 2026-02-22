'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, ReceiptText } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { UserProfile } from '@/lib/types';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { LencoPayment } from './LencoPayment';

const pricingPlans = [
  {
    id: 'monthly' as const,
    title: 'Monthly Subscription',
    price: 350,
    pricePer: 'per month',
    features: ['Manage unlimited properties', 'Manage unlimited tenants', 'SMS and Email reminders', 'Access to all reports'],
  },
];

function PricingCard({ plan, userProfile, subscription }: { plan: typeof pricingPlans[0], userProfile: UserProfile, subscription: ReturnType<typeof useSubscription>['subscription'] }) {
  const isGated = subscription.isGated;
  return (
    <Card className={isGated ? 'border-primary shadow-lg' : ''}>
      <CardHeader>
        <CardTitle>{plan.title}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">ZMW {plan.price}</span>
          <span className="text-muted-foreground">/{plan.id.replace('ly', '')}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {plan.features.map(feature => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <LencoPayment
          amount={plan.price}
          reference={`SUB-${Date.now()}-${userProfile.uid}`}
          firstName={userProfile.name?.split(' ')[0] || ''}
          lastName={userProfile.name?.split(' ').slice(1).join(' ') || ''}
          email={userProfile.email || undefined}
          phone={userProfile.phone || undefined}
          className="w-full"
          onSuccess={() => {
            // Optional: Any additional client-side success handling
          }}
        />
      </CardFooter>
    </Card>
  );
}

export function BillingClient() {
  const { userProfile, subscription, isLoading } = useSubscription();
  const { toast } = useToast();

  if (isLoading || !userProfile) {
    return <div>Loading billing information...</div>;
  }

  const isTrial = subscription.status === 'TRIAL';
  const isActive = subscription.status === 'ACTIVE';

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={isActive || isTrial ? 'success' : 'destructive'}>{subscription.status}</Badge>
            <p className="font-semibold">{subscription.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : 'No Active Plan'}</p>
          </div>
          {isTrial && subscription.trial_end_date && (
            <p className="text-muted-foreground">Your free trial ends on <span className="font-bold text-foreground">{format(new Date(subscription.trial_end_date), 'PPP')}</span>.</p>
          )}
          {isActive && subscription.current_period_end && (
            <p className="text-muted-foreground">Your subscription will renew on <span className="font-bold text-foreground">{format(new Date(subscription.current_period_end), 'PPP')}</span>.</p>
          )}
          {!isActive && !isTrial && (
            <p className="text-destructive">Your subscription is inactive. Please choose a plan to continue using Assetta's features.</p>
          )}
        </CardContent>
      </Card>

      {!userProfile.email && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email Required</AlertTitle>
          <AlertDescription>
            An email address is required to subscribe. Please <Link href="/settings" className="font-bold underline">add one to your account</Link>.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
          <CardDescription>Select a plan to unlock all of Assetta's features.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
            {pricingPlans.map(plan => (
              <PricingCard key={plan.id} plan={plan} userProfile={userProfile} subscription={subscription} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>A record of your subscription payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/50">
            <ReceiptText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Payments Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your payment history will appear here once you subscribe.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
