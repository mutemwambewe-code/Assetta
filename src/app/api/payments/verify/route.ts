import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ success: false, message: 'Missing reference' }, { status: 400 });
    }

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

        if (!response.ok || data.status === false) { // Lenco sometimes returns status: false in body
            console.error('Lenco verification failed:', data);
            return NextResponse.json({ success: false, message: 'Payment verification failed with provider' }, { status: 400 });
        }

        // Check actual payment status
        // The data structure based on docs: data.data.status
        const paymentData = data.data;
        if (paymentData.status !== 'successful') {
            return NextResponse.json({ success: false, message: `Payment status is ${paymentData.status}` }, { status: 400 });
        }

        // Check currency and amount if needed (Optional but recommended)
        // const expectedAmount = ...

        // Extract User ID from reference
        // Format: SUB-timestamp-uid
        const parts = reference.split('-');
        if (parts.length < 3 || !reference.startsWith('SUB-')) {
            return NextResponse.json({ success: false, message: 'Invalid reference format' }, { status: 400 });
        }

        const userId = parts.slice(2).join('-');

        if (!userId || userId === 'guest') {
            return NextResponse.json({ success: false, message: 'Invalid user in reference' }, { status: 400 });
        }

        // Update Firestore
        // Add 30 days to current date
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await adminDb.collection('users').doc(userId).collection('subscriptions').add({
            status: 'active',
            plan: 'pro',
            currentPeriodStart: startDate.toISOString(),
            currentPeriodEnd: endDate.toISOString(),
            providerId: paymentData.id, // Lenco transaction ID
            reference: reference, // Lenco Reference
            paymentMethod: paymentData.type, // 'mobile-money', 'card'
            amount: paymentData.amount,
            currency: paymentData.currency,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Also add to payments history
        await adminDb.collection('users').doc(userId).collection('payments').add({
            amount: parseFloat(paymentData.amount),
            date: new Date().toISOString(),
            status: 'completed',
            method: paymentData.type === 'mobile-money' ? 'Mobile Money' : 'Bank Transfer', // Mapping based on 'type'
            reference: reference,
            providerReference: paymentData.lencoReference
        });

        return NextResponse.json({ success: true, message: 'Subscription activated' });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
