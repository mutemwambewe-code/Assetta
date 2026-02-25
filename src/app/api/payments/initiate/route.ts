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
    const cleanUserId = (userId || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
    return `SUB-${timestamp}-${cleanUserId}-${crypto.randomBytes(4).toString('hex')}`;
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

        // 1. Check for existing UNEXPIRED pending transaction for this user
        // We look for 'pending' or 'initiated' or 'awaiting_user_action'
        const activeStatuses = ['initiated', 'pending', 'awaiting_user_action'];
        let activeQuery;
        try {
            activeQuery = await adminDb.collection('payments')
                .where('userId', '==', userId)
                .where('status', 'in', activeStatuses)
                .where('amount', '==', amount)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
        } catch (dbError: any) {
            console.error('[Initiate API] Firestore query failed:', dbError);
        }

        if (activeQuery && !activeQuery.empty) {
            const existing = activeQuery.docs[0].data();
            const createdAt = new Date(existing.createdAt);
            const now = new Date();
            const diffMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            if (diffMins < EXPIRY_MINUTES) {
                console.log(`[Initiate] IDEMPOTENCY: Reusing active transaction ${existing.reference} for user ${userId}`);
                return NextResponse.json({
                    status: existing.status,
                    message: 'Existing payment session found',
                    reference: existing.reference,
                    reused: true
                });
            } else {
                // Expire the old one
                console.log(`[Initiate] Expiring old transaction ${existing.reference}`);
                await activeQuery.docs[0].ref.update({ status: 'expired', updatedAt: new Date().toISOString() });
            }
        }

        // 2. Generate a fresh reference if none found
        if (!reference || reference.includes('-manual-')) {
            reference = generateReference(userId);
        }

        // 3. Log initiation intent to Firestore
        const paymentDocRef = adminDb.collection('payments').doc(reference);
        try {
            await paymentDocRef.set({
                userId,
                amount,
                currency: 'ZMW',
                mobileNumber,
                provider: provider,
                status: 'initiated', // Initial State
                reference: reference,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (setErr: any) {
            console.error('[Initiate API] Firestore set failed:', setErr);
            throw new Error(`Database error: ${setErr.message}`);
        }

        // 4. Return the reference to the frontend.
        // The frontend WIDGET will handle the actual getPaid() call.
        // We do NOT call Lenco's STK push API here to prevent dual prompts.

        console.log(`[Initiate API] Reference created and ready: ${reference}`);

        return NextResponse.json({
            status: 'initiated',
            message: 'Payment session created',
            reference: reference,
            reused: false
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
