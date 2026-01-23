'use server';

import { redirect } from 'next/navigation';
import type { UserProfile } from '@/hooks/use-subscription';

const LENCO_API_URL = 'https://api.broadpay.io/gateway/api/v1/payment/charge';

interface LencoPaymentResponse {
  status: 'success' | 'error';
  data?: {
    link: string;
  };
  message?: string;
  'status-code'?: number;
}

export async function createLencoPaymentLink(
  user: UserProfile,
  amount: number,
  plan: 'monthly' | 'yearly'
): Promise<{ error?: string } | void> {
  if (!process.env.LENCO_API_KEY || !process.env.LENCO_API_SECRET) {
    console.error('Lenco API credentials are not set in environment variables.');
    return { error: 'Payment service is not configured. Please contact support.' };
  }
  
  const userEmail = user.email;
  if (!userEmail) {
    return { error: 'An email address is required to make a payment. Please add one in your settings.' };
  }
  const userName = user.name || 'Assetta User';

  const payload = {
    "api-key": process.env.LENCO_API_KEY,
    "api-secret": process.env.LENCO_API_SECRET,
    "first-name": userName.split(' ')[0],
    "last-name": userName.split(' ').slice(1).join(' ') || userName.split(' ')[0],
    "phone-number": user.phone || '',
    "contact-email": userEmail,
    "payment-amount": amount,
    "payment-currency": "ZMW",
    "payment-reason": `Assetta Subscription - ${plan}`,
    "customer-reference": user.uid, // Crucial for webhook matching
    "return-url": process.env.LENCO_REDIRECT_URL || 'http://localhost:9003/billing'
  };

  try {
    const response = await fetch(LENCO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result: LencoPaymentResponse = await response.json();
    
    if (result.status === 'success' && result.data?.link) {
      // Redirect to Lenco's payment page
      redirect(result.data.link);
    } else {
      console.error('Lenco API Error:', result);
      return { error: result.message || 'Could not initiate payment. Please try again.' };
    }
  } catch (error) {
    console.error('Failed to create Lenco payment link:', error);
    return { error: 'An unexpected error occurred with the payment service.' };
  }
}
