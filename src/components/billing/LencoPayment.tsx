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
    reference: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    billing?: {
        streetAddress?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
    onSuccess?: () => void;
}

declare global {
    interface Window {
        LencoPay: any;
    }
}

export function LencoPayment({
    amount,
    email,
    className,
    reference,
    firstName,
    lastName,
    phone,
    billing,
    onSuccess
}: LencoPaymentProps) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Determine script URL based on environment
    const isSandbox = process.env.NEXT_PUBLIC_LENCO_IS_SANDBOX === 'true';
    const scriptUrl = isSandbox
        ? "https://sandbox.lenco.co/js/v1/inline.js"
        : "https://pay.lenco.co/js/v1/inline.js";

    useEffect(() => {
        console.log(`[LencoPayment] Environment: ${isSandbox ? 'Sandbox' : 'Production'}`);
        console.log(`[LencoPayment] Script URL: ${scriptUrl}`);
        console.log(`[LencoPayment] Public Key present: ${!!process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY}`);
    }, [isSandbox, scriptUrl]);

    const handlePayment = () => {
        const publicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;

        if (!scriptLoaded) {
            console.warn("[LencoPayment] Attempted payment before script loaded.");
            toast({
                title: "System Loading",
                description: "Payment system is initializing. Please try again in a moment.",
                variant: "destructive"
            });
            return;
        }

        if (!publicKey) {
            console.error("[LencoPayment] Missing NEXT_PUBLIC_LENCO_PUBLIC_KEY");
            toast({
                title: "Configuration Error",
                description: "Payment system public key is missing. Please contact support.",
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
                throw new Error("LencoPay SDK not found on window object");
            }

            console.log("[LencoPayment] Opening widget with reference:", reference);

            window.LencoPay.getPaid({
                key: publicKey,
                reference: reference || `SUB-${Date.now()}-${user?.uid || 'guest'}`,
                email: email || user?.email,
                amount: amount,
                currency: "ZMW",
                channels: ["card", "mobile-money"],
                customer: {
                    firstName: firstName || user?.displayName?.split(' ')[0] || 'Customer',
                    lastName: lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: phone || "0970000000",
                },
                billing: billing,
                onSuccess: function (response: any) {
                    console.log("[LencoPayment] Payment success response:", response);
                    verifyPayment(response.reference);
                },
                onClose: function () {
                    console.log("[LencoPayment] Widget closed by user");
                    setLoading(false);
                    toast({
                        title: "Payment Cancelled",
                        description: "You cancelled the payment process.",
                    });
                },
                onConfirmationPending: function () {
                    console.log("[LencoPayment] Payment confirmation pending");
                    // Keep loading as true to prevent repeat clicks during USSD session
                    setLoading(true);
                    toast({
                        title: "Processing",
                        description: "Please complete the PIN prompt on your phone.",
                    });
                },
            });
        } catch (error) {
            console.error("[LencoPayment] Widget initialization error:", error);
            setLoading(false);
            toast({
                title: "Error",
                description: "Could not initialize payment widget. Please try again.",
                variant: "destructive"
            });
        }
    };

    const verifyPayment = async (reference: string) => {
        try {
            console.log("[LencoPayment] Verifying reference:", reference);
            const res = await fetch(`/api/payments/verify?reference=${reference}`);
            const data = await res.json();

            if (res.ok && data.success) {
                console.log("[LencoPayment] Verification successful");
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
            console.error("[LencoPayment] Verification error:", error);
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
                src={scriptUrl}
                strategy="afterInteractive"
                onLoad={() => {
                    console.log("[LencoPayment] LencoPay script loaded successfully");
                    setScriptLoaded(true);
                }}
                onError={(e) => {
                    console.error("[LencoPayment] LencoPay script failed to load:", e);
                }}
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
