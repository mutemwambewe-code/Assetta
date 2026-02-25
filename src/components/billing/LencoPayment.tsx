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
    const router = useRouter();

    // UI States
    const [status, setStatus] = useState<'idle' | 'initiating' | 'pending' | 'verifying' | 'success' | 'failed'>('idle');
    const [currentReference, setCurrentReference] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sync reference only if idle
    useEffect(() => {
        if (status === 'idle') {
            setCurrentReference(initialReference);
        }
    }, [initialReference, status]);

    // Check status on mount
    useEffect(() => {
        if (user?.uid) {
            checkStatus();
        }
    }, [user?.uid]);

    const checkStatus = async () => {
        if (!user?.uid) return;
        try {
            const res = await fetch(`/api/payments/status?userId=${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'pending' || data.status === 'initiated') {
                    setCurrentReference(data.payment.reference);
                    setStatus('pending');
                }
            }
        } catch (err) {
            console.error("[LencoPayment] Status check failed:", err);
        }
    };

    const handlePayment = async () => {
        // Reset state for new attempt
        setError(null);

        if (status === 'pending') {
            await verifyPayment(currentReference!);
            return;
        }

        const publicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY;
        if (!publicKey) {
            toast({ title: "Config Error", description: "Public key missing", variant: "destructive" });
            return;
        }

        setStatus('initiating');
        try {
            // 1. CREATE TRANSACTION IN DB
            const initRes = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    mobileNumber: phone || "0970000000",
                    provider: "MTN",
                    reference: currentReference,
                    userId: user?.uid
                })
            });

            const initData = await initRes.json();
            if (!initRes.ok) throw new Error(initData.error || "Failed to start payment");

            const refToUse = initData.reference;
            setCurrentReference(refToUse);

            // 2. OPEN WIDGET
            if (typeof window === 'undefined' || !window.LencoPay) {
                throw new Error("Payment SDK not loaded. Try refreshing.");
            }

            console.log("[LencoPayment] Initializing widget with ref:", refToUse);

            // ENSURE FRESH OBJECT ON EVERY CALL
            window.LencoPay.getPaid({
                key: publicKey,
                reference: refToUse,
                email: email || user?.email,
                amount: amount,
                currency: "ZMW",
                customer: {
                    firstName: firstName || user?.displayName?.split(' ')[0] || 'Customer',
                    lastName: lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: phone || "0970000000",
                },
                onSuccess: (response: any) => {
                    console.log("[LencoPayment] onSuccess:", response);
                    setStatus('verifying');
                    verifyPayment(response.reference);
                },
                onClose: () => {
                    console.log("[LencoPayment] onClose");
                    setStatus('idle');
                    if (onClose) onClose();
                },
                onConfirmationPending: () => {
                    console.log("[LencoPayment] onConfirmationPending");
                    setStatus('pending');
                },
            });

        } catch (err: any) {
            console.error("[LencoPayment] handlePayment error:", err);
            setStatus('idle');
            setError(err.message);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const verifyPayment = async (ref: string) => {
        setStatus('verifying');
        try {
            const res = await fetch(`/api/payments/verify?reference=${ref}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                toast({ title: "Success!", description: "Subscription activated." });
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                setStatus('pending');
                toast({
                    title: "Still Pending",
                    description: data.message || "Still waiting for confirmation.",
                    variant: "default"
                });
            }
        } catch (err) {
            setStatus('pending');
            console.error("[LencoPayment] verify error:", err);
        }
    };

    const isProcessing = status === 'initiating' || status === 'verifying';

    return (
        <div className="flex flex-col gap-2 w-full">
            <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className={className}
                variant={status === 'pending' ? "outline" : "default"}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {status === 'verifying' ? 'Verifying...' : 'Starting...'}
                    </>
                ) : status === 'pending' ? (
                    'Re-check Payment'
                ) : (
                    `Pay K${amount}`
                )}
            </Button>

            {status === 'pending' && (
                <div className="flex flex-col gap-1 items-center">
                    <p className="text-[10px] text-primary flex items-center gap-1">
                        <Loader2 className="h-2 w-2 animate-spin" />
                        Prompt sent to phone. Check your phone.
                    </p>
                    <button
                        onClick={() => {
                            setStatus('idle');
                            setCurrentReference(`${initialReference}-${Date.now()}`); // Force new intent next time
                        }}
                        className="text-[10px] text-muted-foreground underline"
                    >
                        Try with different number
                    </button>
                </div>
            )}

            {error && <p className="text-[10px] text-destructive text-center">{error}</p>}
        </div>
    );
}
