'use server';

import { redirect } from 'next/navigation';
import { UserProfile } from '@/lib/types';

const IS_SANDBOX = process.env.LENCO_IS_SANDBOX === 'true';
const LENCO_API_URL = IS_SANDBOX
  ? 'https://sandbox.lenco.co/access/v2/checkout'
  : 'https://api.lenco.co/access/v2/checkout';

interface LencoPaymentResponse {
  status: boolean;
  message?: string;
  data?: {
    url: string;
  };
}

export async function createLencoPaymentLink(
  user: UserProfile,
  amount: number,
  plan: 'monthly' | 'yearly'
): Promise<{ error?: string } | void> {
  const secretKey = process.env.LENCO_SECRET_KEY;
  if (!secretKey) {
    console.error('Lenco secret key is not set in environment variables.');
    return { error: 'Payment service is not configured. Please contact support.' };
  }

  const userEmail = user.email;
  if (!userEmail) {
    return { error: 'An email address is required to make a payment. Please add one in your settings.' };
  }
  const userName = user.name || 'Assetta User';

  const payload = {
    amount: amount.toString(),
    currency: "ZMW",
    reference: `SUB-${Date.now()}-${user.uid}`,
    description: `Assetta Subscription - ${plan === 'monthly' ? 'Monthly' : 'Yearly'}`,
    customer: {
      name: userName,
      email: userEmail,
      phone: user.phone || ''
    },
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003'}/billing?success=true`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003'}/billing?cancel=true`
  };

  try {
    const response = await fetch(LENCO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result: LencoPaymentResponse = await response.json();

    if (result.status === true && result.data?.url) {
      // Redirect to Lenco's payment page
      redirect(result.data.url);
    } else {
      console.error('Lenco API Error:', result);
      return { error: result.message || 'Could not initiate payment. Please try again.' };
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Failed to create Lenco payment link:', error);
    return { error: 'An unexpected error occurred with the payment service.' };
  }
}
