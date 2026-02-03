'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface LencoPaymentProps {
    amount: number;
    email?: string;
    className?: string;
    onSuccess?: () => void;
}

declare global {
    interface Window {
        LencoPay: any;
    }
}

export function LencoPayment({ amount, email, className, onSuccess }: LencoPaymentProps) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const handlePayment = () => {
        if (!scriptLoaded) {
            toast({
                title: "System Loading",
                description: "Payment system is initializing. Please try again in a moment.",
                variant: "destructive"
            });
            return;
        }

        if (!user?.email && !email) {
            toast({
                title: "Missing Information",
                description: "Email is required for payment.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            if (typeof window.LencoPay === 'undefined') {
                throw new Error("LencoPay SDK not loaded");
            }

            window.LencoPay.getPaid({
                key: process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY,
                reference: `SUB-${Date.now()}-${user?.uid || 'guest'}`,
                email: email || user?.email,
                amount: amount,
                currency: "ZMW",
                channels: ["card", "mobile-money"],
                customer: {
                    firstName: user?.displayName?.split(' ')[0] || 'Customer',
                    lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: "0970000000", // Optional: Provide actual phone if available
                },
                onSuccess: function (response: any) {
                    console.log("Payment success:", response);
                    verifyPayment(response.reference);
                },
                onClose: function () {
                    setLoading(false);
                    toast({
                        title: "Payment Cancelled",
                        description: "You cancelled the payment process.",
                    });
                },
                onConfirmationPending: function () {
                    setLoading(false);
                    toast({
                        title: "Processing",
                        description: "Your purchase will be completed when the payment is confirmed.",
                    });
                },
            });
        } catch (error) {
            console.error("Payment init error:", error);
            setLoading(false);
            toast({
                title: "Error",
                description: "Could not initialize payment. Please try again.",
                variant: "destructive"
            });
        }
    };

    const verifyPayment = async (reference: string) => {
        try {
            const res = await fetch(`/api/payments/verify?reference=${reference}`);
            const data = await res.json();

            if (res.ok && data.success) {
                toast({
                    title: "Subscription Active!",
                    description: "Thank you for your payment. You now have full access.",
                });
                if (onSuccess) onSuccess();
                router.push('/');
                router.refresh();
            } else {
                throw new Error(data.message || "Verification failed");
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast({
                title: "Verification Failed",
                description: "Payment succeeded but verification failed. Please contact support.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Script
                src="https://pay.lenco.co/js/v1/inline.js"
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
            />

            <Button
                onClick={handlePayment}
                disabled={loading || !scriptLoaded}
                className={className}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    `Pay K${amount}`
                )}
            </Button>
        </>
    );
}
