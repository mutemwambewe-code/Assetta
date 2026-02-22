import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

const IS_SANDBOX = process.env.LENCO_IS_SANDBOX === 'true';
const LENCO_BASE_URL = IS_SANDBOX
    ? 'https://sandbox.lenco.co/v1/payments/mobile-money'
    : 'https://api.lencopay.com/v1/payments/mobile-money';
const TIMEOUT_MS = 20000;
const EXPIRY_MINUTES = 15;

function generateReference(userId?: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    return `SUB-${timestamp}-${userId || 'unknown'}-${crypto.randomBytes(4).toString('hex')}`;
}

function validateZambianNumber(number: string) {
    const clean = number.replace(/\s+/g, '');
    return /^(?:\+260|260|0)?(95|96|97|76|77)\d{7}$/.test(clean);
}

function normalizeProvider(provider: string) {
    const map: Record<string, string> = {
        MTN: 'mtn',
        AIRTEL: 'airtel',
        ZAMTEL: 'zamtel'
    };

    const upper = provider.toUpperCase();
    if (!map[upper]) throw new Error('Unsupported mobile money provider');
    return map[upper];
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const amount = Number(body.amount);
        const mobileNumber = String(body.mobileNumber || '');
        const provider = String(body.provider || '');
        let reference = body.reference;

        // Extract UID from reference or fallback
        let userId = 'unknown';
        if (reference && reference.startsWith('SUB-')) {
            const parts = reference.split('-');
            userId = parts.slice(2, 3).join('-'); // Usually the UID is here
        }

        if (!amount || amount <= 0)
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

        if (!validateZambianNumber(mobileNumber))
            return NextResponse.json({ error: 'Invalid Zambian mobile number' }, { status: 400 });

        if (!provider)
            return NextResponse.json({ error: 'Provider required' }, { status: 400 });

        // 1. Check for existing pending transaction for this user
        // We only want to reuse if the mobile number and amount are the same
        const pendingQuery = await adminDb.collection('payments')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .where('amount', '==', amount)
            .where('mobileNumber', '==', mobileNumber)
            .limit(1)
            .get();

        if (!pendingQuery.empty) {
            const existing = pendingQuery.docs[0].data();
            const createdAt = existing.createdAt.toDate ? existing.createdAt.toDate() : new Date(existing.createdAt);
            const now = new Date();
            const diffMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            if (diffMins < EXPIRY_MINUTES) {
                console.log(`[Initiate] Reusing pending transaction ${existing.reference} for user ${userId}`);
                return NextResponse.json({
                    status: 'pending',
                    message: 'A payment is already in progress. Please check your phone for the prompt.',
                    reference: existing.reference,
                    reused: true
                });
            }

            // If expired, we should ideally mark it as expired, but for now we'll just create a new one
            await pendingQuery.docs[0].ref.update({ status: 'expired', updatedAt: new Date().toISOString() });
        }

        const mappedProvider = normalizeProvider(provider);

        const apiKey = process.env.LENCO_SECRET_KEY;
        if (!apiKey)
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

        // Use the provided reference or generate a new one if it's "manual" or missing
        if (!reference || reference.includes('-manual-')) {
            reference = generateReference(userId);
        }

        const payload = {
            amount,
            currency: 'ZMW',
            mobileNumber,
            provider: mappedProvider,
            reference: reference,
            description: 'Assetta Subscription Payment'
        };

        // 2. Log initiation intent to Firestore
        const paymentDocRef = adminDb.collection('payments').doc(reference);
        await paymentDocRef.set({
            userId,
            amount,
            currency: 'ZMW',
            mobileNumber,
            provider: provider,
            status: 'initiated',
            reference: reference,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        console.log(`[Initiate] Calling Lenco for reference: ${reference}`);

        const response = await fetch(LENCO_BASE_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': reference
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Lenco Payment Error:', data);
            await paymentDocRef.update({ status: 'failed', error: data.error || 'Lenco initiation failed', updatedAt: new Date().toISOString() });
            return NextResponse.json(
                { error: data.error || 'Payment initiation failed' },
                { status: 502 }
            );
        }

        // 3. Update status to pending
        await paymentDocRef.update({
            status: 'pending',
            providerReference: data.reference, // Store provider's internal ref if any
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            status: 'pending',
            message: 'Payment prompt sent to customer phone',
            reference: reference
        });

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Payment provider timeout' },
                { status: 504 }
            );
        }

        console.error('Payment Route Error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
