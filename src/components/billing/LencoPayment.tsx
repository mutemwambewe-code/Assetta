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
    onClose?: () => void;
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
    onSuccess,
    onClose
}: LencoPaymentProps) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [pendingPayment, setPendingPayment] = useState<any>(null);
    const router = useRouter();

    // Lock the reference in state so it doesn't change on re-renders
    const [currentReference, setCurrentReference] = useState(initialReference);

    useEffect(() => {
        // Sync reference once if it changes from props but only if not loading
        if (!loading && !pendingPayment) {
            setCurrentReference(initialReference);
        }
    }, [initialReference, loading, pendingPayment]);

    // Check for pending on mount
    useEffect(() => {
        if (user?.uid) {
            checkExistingPayment();
        }
    }, [user?.uid]);

    const checkExistingPayment = async () => {
        if (!user?.uid) return;
        setCheckingStatus(true);
        try {
            const res = await fetch(`/api/payments/status?userId=${user.uid}`);
            const data = await res.json();
            if (data.status === 'pending') {
                setPendingPayment(data.payment);
                setCurrentReference(data.payment.reference);
            } else {
                setPendingPayment(null);
            }
        } catch (error) {
            console.error("[LencoPayment] Status check error:", error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handlePayment = async () => {
        if (pendingPayment) {
            await verifyPayment(pendingPayment.reference);
            return;
        }

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
                description: "Email is required for payment. Please update your profile.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // 1. Initiate with our backend first to log to Firestore and check for idempotency
            const initRes = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    mobileNumber: phone || "0970000000",
                    provider: "MTN", // Default if not provided
                    reference: currentReference
                })
            });

            const initData = await initRes.json();
            if (!initRes.ok) throw new Error(initData.error || "Failed to initiate payment");

            // Update reference if backend gave us a new one (or reused one)
            const refToUse = initData.reference;
            setCurrentReference(refToUse);

            if (initData.reused) {
                setPendingPayment({ reference: refToUse });
                setLoading(false);
                toast({
                    title: "Pending Prompt",
                    description: "Reusing existing payment session. Please check your phone.",
                });
                return;
            }

            // Check if global LencoPay exists
            if (typeof window === 'undefined' || !window.LencoPay) {
                console.warn("[LencoPayment] LencoPay SDK not found on window object.");
                if (typeof (window as any).LencoPay === 'undefined') {
                    throw new Error("LencoPay SDK is not available yet. Please wait a moment.");
                }
            }

            console.log("[LencoPayment] Opening widget with reference:", refToUse);

            window.LencoPay.getPaid({
                key: publicKey,
                reference: refToUse,
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
                    if (onClose) onClose();
                    // We don't automatically refresh here anymore because our backend handles the state
                },
                onConfirmationPending: function () {
                    console.log("[LencoPayment] Payment confirmation pending");
                    setLoading(true);
                    setPendingPayment({ reference: refToUse });
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
        setLoading(true);
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
                throw new Error(data.message || "Payment not yet verified. Please complete the prompt on your phone.");
            }
        } catch (error: any) {
            console.error("[LencoPayment] Verification error:", error);
            toast({
                title: "Status Update",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            {pendingPayment && (
                <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <Loader2 className="h-2 w-2 animate-spin" />
                    Transaction Pending...
                </p>
            )}
            <Button
                onClick={handlePayment}
                disabled={loading || checkingStatus}
                className={className}
                variant={pendingPayment ? "outline" : "default"}
            >
                {loading || checkingStatus ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {checkingStatus ? 'Syncing...' : 'Processing...'}
                    </>
                ) : pendingPayment ? (
                    'Check Payment Status'
                ) : (
                    `Pay K${amount}`
                )}
            </Button>
            {pendingPayment && (
                <button
                    onClick={() => {
                        setPendingPayment(null);
                        setCurrentReference(initialReference + '-' + Date.now());
                    }}
                    className="text-[10px] text-muted-foreground underline text-center"
                >
                    Cancel & Start New
                </button>
            )}
        </div>
    );
}
