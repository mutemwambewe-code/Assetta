
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { amount, mobileNumber, provider } = await req.json(); // provider e.g., 'MTN', 'AIRTEL'

        // Validate inputs
        if (!amount || !mobileNumber || !provider) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const lencoUrl = 'https://api.lencopay.com/v1/payments/mobile-money'; // Verify actual endpoint
        const apiKey = process.env.LENCO_SECRET_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Map provider to Lenco codes if necessary
        // Example: MTN -> 'mtn-zm', Airtel -> 'airtel-zm'
        const providerMap: Record<string, string> = {
            'MTN': 'mtn',
            'AIRTEL': 'airtel',
            'ZAMTEL': 'zamtel'
        };

        const mappedProvider = providerMap[provider] || provider.toLowerCase();

        console.log('Initiating Payment:', { amount, mobileNumber, provider, mappedProvider });

        const response = await fetch(lencoUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                currency: 'ZMW',
                mobileNumber,
                provider: mappedProvider,
                reference: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                description: 'Assetta Pro Subscription'
            })
        });

        const data = await response.json();
        console.log('Lenco API Response:', response.status, data);

        if (!response.ok) {
            console.error('Lenco API Error:', data);
            return NextResponse.json({ error: data.message || 'Payment initiation failed', details: data }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Payment API Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}
