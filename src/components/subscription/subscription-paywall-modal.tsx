
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPaywallModalProps {
    isOpen: boolean;
    onClose?: () => void; // Optional if we want to force stay open
}

export function SubscriptionPaywallModal({ isOpen, onClose }: SubscriptionPaywallModalProps) {
    const [provider, setProvider] = useState<string>('MTN');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Lock the reference in state so it doesn't change on re-renders
    const [paymentReference, setPaymentReference] = useState(`SUB-${Math.floor(Date.now() / 1000)}-manual-${Math.random().toString(36).substring(7)}`);

    // Reset reference and loading when modal opens
    useEffect(() => {
        if (isOpen) {
            setPaymentReference(`SUB-${Math.floor(Date.now() / 1000)}-manual-${Math.random().toString(36).substring(7)}`);
            setLoading(false);
        }
    }, [isOpen]);

    const handlePayment = async () => {
        if (loading) return; // Prevent double trigger
        setLoading(true);
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

            toast({
                title: 'Payment Initiated',
                description: 'Please complete the PIN prompt on your phone.',
            });

            // Keep loading as true while waiting for confirmation
            // In a better version, we'd poll or wait for webhook
            // setLoading(true); // This is redundant as loading is already true

        } catch (error: any) {
            console.error("[SubscriptionPaywallModal] Initiation error:", error);
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
            setLoading(false); // Reset on error so they can try again
        }
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
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="provider" className="text-right">
                            Network
                        </Label>
                        <div className="col-span-3">
                            <Select value={provider} onValueChange={setProvider}>
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
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handlePayment} disabled={loading || !phone || phone.length < 10}>
                        {loading ? 'Processing...' : 'Pay Now (ZMW 150)'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
