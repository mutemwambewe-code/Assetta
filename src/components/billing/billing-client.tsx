'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useSubscription, type UserProfile } from '@/hooks/use-subscription';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { createLencoPaymentLink } from '@/app/actions/create-payment-link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import Link from 'next/link';

const pricingPlans = [
  {
    id: 'monthly' as const,
    title: 'Monthly Subscription',
    price: 350,
    pricePer: 'per month',
    features: ['Manage unlimited properties', 'Manage unlimited tenants', 'SMS and Email reminders', 'Access to all reports'],
  },
];

function SubscriptionButton({
  user,
  plan,
  amount,
  isCurrent,
  isDisabled,
}: {
  user: UserProfile;
  plan: 'monthly' | 'yearly';
  amount: number;
  isCurrent: boolean;
  isDisabled: boolean;
}) {
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast();

  const handleSubscription = () => {
    startTransition(async () => {
      const result = await createLencoPaymentLink(user, amount, plan);
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: result.error,
        });
      }
    });
  };

  if (isCurrent) {
    return <Button disabled>Current Plan</Button>;
  }

  return (
    <Button onClick={handleSubscription} disabled={isPending || isDisabled}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {`Subscribe Now`}
    </Button>
  );
}


function PricingCard({ plan, userProfile, subscription }: { plan: typeof pricingPlans[0], userProfile: UserProfile, subscription: ReturnType<typeof useSubscription>['subscription'] }) {
  const { isGated } = useSubscription();
  return (
    <Card className={isGated ? 'border-primary' : ''}>
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
        <SubscriptionButton
          user={userProfile}
          plan={plan.id}
          amount={plan.price}
          isCurrent={subscription.plan === plan.id && subscription.status === 'ACTIVE'}
          isDisabled={!userProfile.email}
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={isActive || isTrial ? 'success' : 'destructive'}>{subscription.status}</Badge>
            <p className="font-semibold">{subscription.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : 'No Active Plan'}</p>
          </div>
          {isTrial && subscription.trial_end_date && (
             <p>Your free trial ends on {format(new Date(subscription.trial_end_date), 'PPP')}.</p>
          )}
          {isActive && subscription.current_period_end && (
              <p>Your subscription will renew on {format(new Date(subscription.current_period_end), 'PPP')}.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pricingPlans.map(plan => (
          <PricingCard key={plan.id} plan={plan} userProfile={userProfile} subscription={subscription} />
        ))}
      </div>
    </div>
  );
}
