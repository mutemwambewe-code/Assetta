
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-lenco-signature') || '';
        // Verify signature here (omitted for MVP, but should be added for production)

        const event = await req.json();
        const { eventType, payload, id: eventId } = event;

        if (!eventId) {
            return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
        }

        // 1. IDEMPOTENCY CHECK
        const eventRef = adminDb.collection('webhookEvents').doc(eventId);
        const eventDoc = await eventRef.get();
        if (eventDoc.exists) return NextResponse.json({ received: true });

        // 2. PROCESS EVENT
        // Supports 'subscription.updated', 'payment.success', 'payment.failed'
        if (eventType === 'subscription.updated' || eventType === 'payment.success') {
            // Assuming payload contains userId, planId, status, nextBillingDate, providerId
            // Adjust according to actual Lenco payload structure. 
            // Mapping generic payload to our schema.

            const userId = payload.customer?.reference || payload.userId; // Ensure we send userId as reference in Lenco

            if (userId) {
                const status = payload.status === 'paid' || payload.status === 'active' ? 'active' : payload.status;

                await adminDb.collection('users').doc(userId).collection('subscriptions').add({
                    status: status,
                    plan: payload.plan || 'basic', // Default or derived
                    currentPeriodEnd: payload.next_payment_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    providerId: payload.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Also log the payment if it's a payment event
                if (eventType === 'payment.success') {
                    await adminDb.collection('users').doc(userId).collection('payments').add({
                        amount: payload.amount,
                        date: new Date().toISOString(),
                        status: 'completed',
                        method: 'Mobile Money',
                        reference: payload.reference
                    });
                }
            }
        }

        // 3. STORE EVENTID
        await eventRef.set({ processedAt: new Date(), type: eventType });
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook failed', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
