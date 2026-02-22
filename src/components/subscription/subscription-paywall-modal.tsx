
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';

interface SubscriptionPaywallModalProps {
    isOpen: boolean;
    onClose?: () => void; // Optional if we want to force stay open
}

export function SubscriptionPaywallModal({ isOpen, onClose }: SubscriptionPaywallModalProps) {
    const { user } = useUser();
    const [provider, setProvider] = useState<string>('MTN');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [pendingPayment, setPendingPayment] = useState<any>(null);
    const { toast } = useToast();

    // Lock the reference in state so it doesn't change on re-renders, but allow it to be refreshed
    const [idSession] = useState(() => Math.random().toString(36).substring(7));
    const [refreshCounter, setRefreshCounter] = useState(0);

    const paymentReference = useMemo(() => {
        // format: SUB-timestamp-uid-session-counter
        const ts = Math.floor(Date.now() / 1000);
        return `SUB-${ts}-${user?.uid || 'guest'}-${idSession}-${refreshCounter}`;
    }, [idSession, refreshCounter, user?.uid]);

    const [initiated, setInitiated] = useState(false);

    // 1. Check for pending payments on mount or when modal opens
    useEffect(() => {
        if (isOpen && user?.uid) {
            checkExistingPayment();
        }
    }, [isOpen, user?.uid]);

    const checkExistingPayment = async () => {
        if (!user?.uid) return;
        setCheckingStatus(true);
        try {
            const res = await fetch(`/api/payments/status?userId=${user.uid}`);
            if (!res.ok) {
                const text = await res.text();
                console.error("[Status API] Server returned error:", res.status, text.substring(0, 100));
                return;
            }
            const data = await res.json();
            if (data.status === 'pending') {
                setPendingPayment(data.payment);
                setInitiated(true);
                setProvider(data.payment.provider || 'MTN');
                setPhone(data.payment.mobileNumber || '');
            } else {
                setPendingPayment(null);
            }
        } catch (error) {
            console.error("[SubscriptionPaywallModal] Status check error:", error);
        } finally {
            setCheckingStatus(false);
        }
    };

    // Reset loading when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoading(false);
            if (!pendingPayment) setInitiated(false);
        }
    }, [isOpen, pendingPayment]);

    const handlePayment = async () => {
        if (loading || (initiated && !pendingPayment)) return; // Prevent double trigger

        // If we have a pending payment, we just want to "verify" it or show info
        if (pendingPayment) {
            await verifyExisting();
            return;
        }

        setLoading(true);
        setInitiated(true);
        try {
            console.log("[SubscriptionPaywallModal] Initiating payment with reference:", paymentReference);
            const res = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 150, // ZMW
                    mobileNumber: phone,
                    provider: provider,
                    reference: paymentReference
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            if (data.reused) {
                toast({
                    title: 'Payment in Progress',
                    description: 'Reusing your existing payment session. Please check your phone.',
                });
                setPendingPayment({ reference: data.reference });
            } else {
                toast({
                    title: 'Payment Initiated',
                    description: 'Please complete the PIN prompt on your phone.',
                });
            }

        } catch (error: any) {
            console.error("[SubscriptionPaywallModal] Initiation error:", error);
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
            setLoading(false);
            setInitiated(false);
        }
    };

    const verifyExisting = async () => {
        const ref = pendingPayment?.reference || paymentReference;
        setLoading(true);
        try {
            const res = await fetch(`/api/payments/verify?reference=${ref}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${res.status}`);
            }
            const data = await res.json();
            if (res.ok && data.success) {
                toast({
                    title: 'Success!',
                    description: 'Your subscription is now active.',
                });
                if (onClose) onClose();
                window.location.reload(); // Hard refresh to update everything
            } else {
                toast({
                    title: 'Not Verified',
                    description: data.message || 'Payment not yet cleared. Please try again in a moment.',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to verify payment status.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setRefreshCounter(prev => prev + 1);
        setInitiated(false);
        setLoading(false);
        setPendingPayment(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Your Free Trial has Ended</DialogTitle>
                    <DialogDescription>
                        To continue managing your properties with Assetta Pro, please subscribe for <strong>ZMW 150/month</strong>.
                    </DialogDescription>
                </DialogHeader>

                {checkingStatus ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Checking payment status...</p>
                    </div>
                ) : (
                    <>
                        {pendingPayment && (
                            <Alert className="mb-4 bg-primary/5 border-primary/20">
                                <Info className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-primary font-semibold">Payment Pending</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                    You have a pending transaction from {new Date(pendingPayment.createdAt).toLocaleTimeString()}.
                                    Please complete it on your phone or check status below.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="provider" className="text-right">
                                    Network
                                </Label>
                                <div className="col-span-3">
                                    <Select value={provider} onValueChange={setProvider} disabled={!!pendingPayment}>
                                        <SelectTrigger id="provider">
                                            <SelectValue placeholder="Select Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MTN">MTN</SelectItem>
                                            <SelectItem value="AIRTEL">Airtel</SelectItem>
                                            <SelectItem value="ZAMTEL">Zamtel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="097xxxxxxx"
                                    className="col-span-3"
                                    disabled={!!pendingPayment}
                                />
                            </div>
                        </div>
                    </>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {initiated && !loading && (
                        <Button variant="ghost" onClick={handleRetry} className="text-xs">
                            {pendingPayment ? 'Start New Attempt' : 'Change Details / Retry'}
                        </Button>
                    )}
                    <Button
                        onClick={handlePayment}
                        disabled={loading || checkingStatus || (!phone || phone.length < 10)}
                        className="min-w-[120px]"
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : pendingPayment ? (
                            'Check Status'
                        ) : initiated ? (
                            'Payment Sent'
                        ) : (
                            'Pay Now (ZMW 150)'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
