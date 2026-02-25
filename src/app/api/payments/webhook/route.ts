import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-lenco-signature');
        const secretKey = process.env.LENCO_SECRET_KEY;

        if (!secretKey) {
            console.error('[Webhook] LENCO_SECRET_KEY not set');
            return new Response('Configuration Error', { status: 500 });
        }

        // 1. Verify Signature
        const hash = crypto
            .createHmac('sha512', secretKey)
            .update(JSON.stringify(body))
            .digest('hex');

        if (hash !== signature) {
            console.warn('[Webhook] Invalid signature');
            return new Response('Invalid Signature', { status: 401 });
        }

        console.log('[Webhook] Received valid event:', body.event, body.data?.reference);

        const event = body.event;
        const data = body.data;
        const reference = data.reference;

        if (!reference) return new Response('No reference', { status: 400 });

        const adminDb = getAdminDb();
        const paymentDocRef = adminDb.collection('payments').doc(reference);
        const paymentDoc = await paymentDocRef.get();

        if (!paymentDoc.exists) {
            console.warn(`[Webhook] Payment record for ref ${reference} not found`);
            return new Response('Record not found', { status: 200 }); // Still return 200 to acknowledge receipt
        }

        const currentData = paymentDoc.data();
        const userId = currentData?.userId;

        // 2. Handle Event
        if (event === 'collection.successful') {
            await paymentDocRef.update({
                status: 'successful',
                providerReference: data.id,
                updatedAt: new Date().toISOString()
            });

            if (userId && userId !== 'unknown') {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);

                await adminDb.collection('users').doc(userId).set({
                    subscriptionStatus: 'active',
                    subscriptionEndDate: endDate.toISOString(),
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                console.log(`[Webhook] Activated subscription for user ${userId}`);
            }
        } else if (event === 'collection.failed') {
            await paymentDocRef.update({
                status: 'failed',
                error: data.failureReason || 'Payment failed',
                updatedAt: new Date().toISOString()
            });
        }

        return new Response('OK', { status: 200 });
    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        return new Response('Internal Error', { status: 500 });
    }
}
