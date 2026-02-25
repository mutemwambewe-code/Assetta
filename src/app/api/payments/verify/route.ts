import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    try {
        // verify with Lenco
        // Use secret key for server-to-server verification
        const apiKey = process.env.LENCO_SECRET_KEY;
        if (!apiKey) {
            console.error('LENCO_SECRET_KEY is not set');
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
        }

        const isSandbox = process.env.LENCO_IS_SANDBOX === 'true';
        const lencoUrl = isSandbox
            ? `https://sandbox.lenco.co/access/v2/collections/status/${reference}`
            : `https://api.lenco.co/access/v2/collections/status/${reference}`;

        const response = await fetch(lencoUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Verify API] Lenco fetch failed:', data);
            return NextResponse.json({ success: false, message: 'Could not reach payment provider' }, { status: 502 });
        }

        // Lenco Access V2 Statuses: 'pending', 'successful', 'failed'
        const lencoStatus = data.data?.status;
        const paymentData = data.data;

        const paymentDocRef = adminDb.collection('payments').doc(reference);
        const paymentDoc = await paymentDocRef.get();

        if (!paymentDoc.exists) {
            return NextResponse.json({ success: false, message: 'Transaction record not found' }, { status: 404 });
        }

        const currentData = paymentDoc.data();

        // Mapping Lenco status to our State Machine
        let nextStatus = currentData?.status;
        if (lencoStatus === 'successful') nextStatus = 'successful';
        else if (lencoStatus === 'failed') nextStatus = 'failed';
        else if (lencoStatus === 'pending') nextStatus = 'pending';

        // Update the payment record
        await paymentDocRef.update({
            status: nextStatus,
            providerReference: paymentData.id || null,
            updatedAt: new Date().toISOString()
        });

        if (nextStatus !== 'successful') {
            return NextResponse.json({
                success: false,
                status: nextStatus,
                message: `Payment is ${nextStatus}. Please complete the prompt on your phone.`
            });
        }

        // Double check: If already successful in our DB, we might have already activated subscription (via webhook)
        // But for redundancy, we activate here too if not already done.

        const userId = currentData?.userId;
        if (!userId || userId === 'unknown') {
            return NextResponse.json({ success: false, message: 'User ID missing in record' }, { status: 400 });
        }

        // Activate Subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Update user's subscription status
        await adminDb.collection('users').doc(userId).set({
            subscriptionStatus: 'active',
            subscriptionEndDate: endDate.toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        await adminDb.collection('users').doc(userId).collection('subscriptions').add({
            status: 'active',
            plan: 'pro',
            currentPeriodStart: startDate.toISOString(),
            currentPeriodEnd: endDate.toISOString(),
            providerId: paymentData.id,
            reference: reference,
            amount: paymentData.amount,
            currency: paymentData.currency,
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Verification error:', error);

        // Try to mark as failed if it was a verification error
        if (reference) {
            try {
                await adminDb.collection('payments').doc(reference).update({
                    status: 'failed',
                    error: (error as Error).message || 'Internal verification error',
                    updatedAt: new Date().toISOString()
                });
            } catch (e) {
                console.error('Failed to mark payment as failed:', e);
            }
        }

        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
