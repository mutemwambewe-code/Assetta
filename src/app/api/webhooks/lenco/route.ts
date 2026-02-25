import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const adminDb = getAdminDb();
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
        // Lenco event types: 'payment.successful', etc.
        if (eventType === 'payment.successful') {
            const reference = payload.reference;
            if (!reference || !reference.startsWith('SUB-')) {
                console.error('Invalid reference in webhook:', reference);
                return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
            }

            // Reference format: SUB-timestamp-userId
            const parts = reference.split('-');
            if (parts.length < 3) {
                return NextResponse.json({ error: 'Invalid reference format' }, { status: 400 });
            }

            const userId = parts.slice(2).join('-');
            const amount = payload.amount;
            const providerId = payload.id;

            if (userId) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30); // 30 day subscription

                await adminDb.collection('users').doc(userId).collection('subscriptions').add({
                    status: 'active',
                    plan: 'monthly', // We can derive this from reference if we add it there
                    currentPeriodStart: startDate.toISOString(),
                    currentPeriodEnd: endDate.toISOString(),
                    providerId: providerId,
                    reference: reference,
                    amount: amount,
                    currency: payload.currency || 'ZMW',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Also log the payment
                await adminDb.collection('users').doc(userId).collection('payments').add({
                    amount: amount,
                    date: new Date().toISOString(),
                    status: 'completed',
                    method: 'Mobile Money', // Or derive from payload.type
                    reference: reference,
                    providerReference: payload.lencoReference || providerId
                });

                // Update user profile status if needed
                await adminDb.collection('users').doc(userId).update({
                    subscription_status: 'ACTIVE',
                    plan: 'monthly',
                    current_period_end: endDate.toISOString()
                });
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
