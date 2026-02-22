import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || userId === 'undefined') {
        console.warn('[Status API] Invalid userId provided:', userId);
        return NextResponse.json({ status: 'none', message: 'User ID required' });
    }

    try {
        console.log('[Status API] Checking status for user:', userId);
        const pendingQuery = await adminDb.collection('payments')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        if (pendingQuery.empty) {
            console.log('[Status API] No pending payments for user:', userId);
            return NextResponse.json({ status: 'none' });
        }

        const payment = pendingQuery.docs[0].data();
        console.log('[Status API] Found pending payment:', payment.reference);

        // Handle dates (Firestore Timestamp vs ISO string)
        let createdAt;
        if (payment.createdAt && typeof payment.createdAt.toDate === 'function') {
            createdAt = payment.createdAt.toDate();
        } else {
            createdAt = new Date(payment.createdAt || Date.now());
        }

        const now = new Date();
        const diffMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (diffMins >= 15) {
            console.log('[Status API] Payment expired:', payment.reference);
            await pendingQuery.docs[0].ref.update({
                status: 'expired',
                updatedAt: new Date().toISOString()
            });
            return NextResponse.json({ status: 'none' });
        }

        return NextResponse.json({
            status: 'pending',
            payment: {
                reference: payment.reference,
                amount: payment.amount,
                provider: payment.provider,
                mobileNumber: payment.mobileNumber,
                createdAt: createdAt.toISOString()
            }
        });

    } catch (error: any) {
        console.error('[Status API] Error:', error);
        return NextResponse.json({
            error: 'Failed to check status',
            details: error.message
        }, { status: 500 });
    }
}
