import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        const pendingQuery = await adminDb.collection('payments')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (pendingQuery.empty) {
            return NextResponse.json({ status: 'none' });
        }

        const payment = pendingQuery.docs[0].data();

        // Check for expiry (15 mins)
        const createdAt = payment.createdAt.toDate ? payment.createdAt.toDate() : new Date(payment.createdAt);
        const now = new Date();
        const diffMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (diffMins >= 15) {
            await pendingQuery.docs[0].ref.update({ status: 'expired', updatedAt: new Date().toISOString() });
            return NextResponse.json({ status: 'none' });
        }

        return NextResponse.json({
            status: 'pending',
            payment: {
                reference: payment.reference,
                amount: payment.amount,
                provider: payment.provider,
                mobileNumber: payment.mobileNumber,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
