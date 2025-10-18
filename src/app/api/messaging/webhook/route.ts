
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { findUserByPhoneNumber, addIncomingMessageToLog, updateMessageDeliveryStatus, findUserByLocalMessageId } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
// This is a secure way to access Firestore from the server-side.
if (!getApps().length) {
    try {
        // App Hosting provides the credentials automatically, so we can initialize without parameters.
        initializeApp();
    } catch (e) {
        console.error('Firebase Admin SDK initialization failed.', e);
    }
}

const db = getFirestore();

// The main handler for POST requests from Africa's Talking
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());

    console.log('[Webhook] Received request from Africa\'s Talking with body:', body);
    
    // Check if it's an incoming message
    if (body.from && body.text) {
      const { from, text, date, id } = body as { from: string; text: string; date: string; id: string };
      
      const user = await findUserByPhoneNumber(db, from);

      if (user) {
        await addIncomingMessageToLog(db, user.uid, user.tenant, text, date, id);
        revalidatePath(`/communication`);
        revalidatePath(`/tenants/${user.tenant.id}`);
      } else {
        console.warn(`[Webhook] Received message from unknown number: ${from}`);
      }
    } 
    // Check if it's a delivery report
    else if (body.id && body.status) {
      const { id, status, failureReason, networkCode, retryCount, metadata } = body as {
        id: string; 
        status: string; 
        failureReason?: string; 
        networkCode?: string;
        retryCount?: string;
        metadata?: string 
      };
      
      const finalStatus = status === 'Failed' ? `${status}: ${failureReason}` : status;
      
      let localMessageId;
       if (metadata && typeof metadata === 'string') {
          try {
              const jsonString = metadata.replace(/'/g, '"');
              const parsedMeta = JSON.parse(jsonString);
              localMessageId = parsedMeta.localMessageId;
          } catch(e) {
              console.warn('[Webhook] Could not parse metadata:', metadata);
          }
      }

      if (localMessageId) {
        const user = await findUserByLocalMessageId(db, localMessageId);
        if (user) {
            await updateMessageDeliveryStatus(db, user.uid, localMessageId, finalStatus, id);
            revalidatePath(`/communication`);
            revalidatePath(`/tenants/${user.tenantId}`);
        } else {
            console.warn(`[Webhook] Could not find user/message for local ID: ${localMessageId}`);
        }
      } else {
          console.warn(`[Webhook] Delivery report for provider ID ${id} is missing a localMessageId in its metadata. Cannot update status.`);
      }
    } 
    else if (body.id && !body.status){
      console.log(`[Webhook] Received an event notification for message ID: ${body.id}. Awaiting delivery report.`);
    }
    else {
      console.warn('[Webhook] Received an unhandled request format:', body);
    }

    // Africa's Talking expects a 200 OK response to acknowledge receipt
    return new NextResponse('OK', { status: 200 });

  } catch (error: any) {
    console.error('[Webhook] Error processing request:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
