import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

const IS_SANDBOX = process.env.LENCO_IS_SANDBOX === 'true';
const LENCO_BASE_URL = IS_SANDBOX
    ? 'https://sandbox.lenco.co/access/v2/collections/mobile-money'
    : 'https://api.lenco.co/access/v2/collections/mobile-money';
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
        const adminDb = getAdminDb();
        const body = await req.json();
        console.log('[Initiate API] Received body:', JSON.stringify(body));

        const amount = Number(body.amount);
        const mobileNumber = String(body.mobileNumber || '');
        const provider = String(body.provider || '');
        let reference = body.reference;
        const userId = body.userId || 'unknown'; // Support passing userId directly

        if (!amount || amount <= 0)
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

        if (!validateZambianNumber(mobileNumber))
            return NextResponse.json({ error: 'Invalid Zambian mobile number' }, { status: 400 });

        if (!provider)
            return NextResponse.json({ error: 'Provider required' }, { status: 400 });

        // 1. Check for existing pending transaction for this user
        let pendingQuery;
        try {
            pendingQuery = await adminDb.collection('payments')
                .where('userId', '==', userId)
                .where('status', '==', 'pending')
                .where('amount', '==', amount)
                .get();
        } catch (dbError: any) {
            console.error('[Initiate API] Firestore query failed:', dbError);
            // Fallback: Continue without reusing if query fails (likely index issue)
        }

        if (pendingQuery && !pendingQuery.empty) {
            const existing = pendingQuery.docs[0].data();
            // Filter by mobileNumber manually to avoid complex composite index requirement
            if (existing.mobileNumber === mobileNumber) {
                const createdAtStr = existing.createdAt;
                const createdAt = new Date(createdAtStr);
                const now = new Date();
                const diffMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);

                if (diffMins < EXPIRY_MINUTES) {
                    console.log(`[Initiate] Reusing pending transaction ${existing.reference} for user ${userId}`);
                    return NextResponse.json({
                        status: 'pending',
                        message: 'A payment is already in progress.',
                        reference: existing.reference,
                        reused: true
                    });
                }

                await pendingQuery.docs[0].ref.update({ status: 'expired', updatedAt: new Date().toISOString() });
            }
        }

        const mappedProvider = normalizeProvider(provider);

        const apiKey = process.env.LENCO_SECRET_KEY;
        if (!apiKey) {
            console.error('[Initiate API] LENCO_SECRET_KEY is missing');
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        // Generate normalized reference if missing or manual
        if (!reference || reference.includes('-manual-')) {
            reference = generateReference(userId);
        }

        const payload = {
            amount: amount.toString(),
            currency: 'ZMW',
            mobileNumber: mobileNumber,
            provider: mappedProvider,
            reference: reference,
            description: 'Assetta Subscription Payment'
        };

        // 2. Log initiation intent to Firestore
        const paymentDocRef = adminDb.collection('payments').doc(reference);
        try {
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
        } catch (setErr: any) {
            console.error('[Initiate API] Firestore set failed:', setErr);
            throw new Error(`Database error: ${setErr.message}`);
        }

        // 3. Return the reference to the frontend.
        // We NO LONGER call Lenco's STK push API here because the frontend widget will handle it.
        // This prevents double prompts.
        await paymentDocRef.update({
            status: 'pending',
            updatedAt: new Date().toISOString()
        });

        console.log(`[Initiate API] Reference created and pending: ${reference}`);

        return NextResponse.json({
            status: 'pending',
            message: 'Payment session initialized',
            reference: reference
        });

    } catch (error: any) {
        console.error('[Initiate API] Global Error:', error);

        if (error.name === 'AbortError') {
            return NextResponse.json(
                { error: 'Payment provider timeout' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
