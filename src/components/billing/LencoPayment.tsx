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
    reference: initialReference,
    firstName,
    lastName,
    phone,
    billing,
    onSuccess
}: LencoPaymentProps) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Lock the reference in state so it doesn't change on re-renders
    const [currentReference, setCurrentReference] = useState(initialReference);

    useEffect(() => {
        // Sync reference once if it changes from props but only if not loading
        if (!loading) {
            setCurrentReference(initialReference);
        }
    }, [initialReference, loading]);

    const handlePayment = () => {
        const publicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;

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
            // Check if global LencoPay exists
            if (typeof window === 'undefined' || !window.LencoPay) {
                console.warn("[LencoPayment] LencoPay SDK not found on window object. It might still be loading.");

                // Fallback attempt: if script just finished loading but wasn't assigned yet
                if (typeof (window as any).LencoPay === 'undefined') {
                    throw new Error("LencoPay SDK is not available yet. Please wait a moment.");
                }
            }

            console.log("[LencoPayment] Opening widget with reference:", currentReference);

            window.LencoPay.getPaid({
                key: publicKey,
                reference: currentReference,
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
                    // Generate a NEW reference for the next attempt if they want to try again
                    setCurrentReference(`${initialReference.split('-').slice(0, 2).join('-')}-${Date.now()}`);
                    toast({
                        title: "Payment Closed",
                        description: "The payment window was closed.",
                    });
                },
                onConfirmationPending: function () {
                    console.log("[LencoPayment] Payment confirmation pending");
                    setLoading(true);
                    toast({
                        title: "Processing",
                        description: "Please complete the PIN prompt on your phone.",
                    });
                },
            });
        } catch (error: any) {
            console.error("[LencoPayment] Widget initialization error:", error);
            setLoading(false);
            toast({
                title: "Error",
                description: error.message || "Could not initialize payment widget. Please try again.",
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
        <Button
            onClick={handlePayment}
            disabled={loading}
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
    );
}
