import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const IS_SANDBOX = process.env.LENCO_IS_SANDBOX === 'true';
const LENCO_BASE_URL = IS_SANDBOX
    ? 'https://sandbox.lenco.co/v1/payments/mobile-money'
    : 'https://api.lencopay.com/v1/payments/mobile-money';
const TIMEOUT_MS = 20000;

function generateReference() {
    return `ASSETTA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
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

        if (!amount || amount <= 0)
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

        if (!validateZambianNumber(mobileNumber))
            return NextResponse.json({ error: 'Invalid Zambian mobile number' }, { status: 400 });

        if (!provider)
            return NextResponse.json({ error: 'Provider required' }, { status: 400 });

        const mappedProvider = normalizeProvider(provider);

        const apiKey = process.env.LENCO_SECRET_KEY;
        if (!apiKey)
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const payload = {
            amount,
            currency: 'ZMW',
            mobileNumber,
            provider: mappedProvider,
            reference: generateReference(),
            description: 'Assetta Subscription Payment'
        };

        const response = await fetch(LENCO_BASE_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': crypto.randomUUID()
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Lenco Payment Error:', data);
            return NextResponse.json(
                { error: 'Payment initiation failed' },
                { status: 502 }
            );
        }

        return NextResponse.json({
            status: 'pending',
            message: 'Payment prompt sent to customer phone',
            reference: payload.reference
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
