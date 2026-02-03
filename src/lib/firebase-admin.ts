import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore, DocumentData, Query } from 'firebase-admin/firestore';
import type { Tenant } from './types';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

export const adminDb = getFirestore();

// This file contains server-side helper functions for interacting with Firestore using the Admin SDK.

/**
 * Normalizes a phone number to a consistent format for querying.
 * Basic implementation: ensures it starts with '+'.
 * @param phoneNumber The phone number to normalize.
 * @returns The normalized phone number.
 */
function normalizePhoneNumber(phoneNumber: string): string {
    let cleanNumber = phoneNumber.replace(/\s/g, ''); // Remove spaces
    if (!cleanNumber.startsWith('+')) {
        // This is a naive assumption. A more robust solution might use a library
        // to handle different country code formats if your app supports multiple countries.
        if (cleanNumber.length === 12 && cleanNumber.startsWith('260')) {
            cleanNumber = `+${cleanNumber}`;
        } else if (cleanNumber.length === 9 && !cleanNumber.startsWith('0')) {
            cleanNumber = `+260${cleanNumber}`;
        }
    }
    return cleanNumber;
}


/**
 * Finds a user and their tenant document based on a phone number.
 * @param db The Firestore admin instance.
 * @param phoneNumber The phone number to search for.
 * @returns A promise that resolves to the user's UID and tenant data, or null if not found.
 */
export async function findUserByPhoneNumber(db: Firestore, phoneNumber: string): Promise<{ uid: string; tenant: Tenant } | null> {
    const normalizedNumber = normalizePhoneNumber(phoneNumber);

    // We need to query across all 'tenants' subcollections.
    const tenantsQuery = db.collectionGroup('tenants') as Query<Tenant>;
    const snapshot = await tenantsQuery.get();

    if (snapshot.empty) {
        return null;
    }

    for (const doc of snapshot.docs) {
        const tenant = doc.data();
        // We must normalize the stored number as well for a reliable comparison.
        if (normalizePhoneNumber(tenant.phone) === normalizedNumber) {
            // The user ID is the parent of the 'tenants' collection.
            const uid = doc.ref.parent.parent?.id;
            if (uid) {
                return { uid, tenant };
            }
        }
    }

    return null;
}

/**
 * Finds a user and their tenant document based on a local message ID.
 * @param db The Firestore admin instance.
 * @param localMessageId The local message ID to search for.
 * @returns A promise that resolves to the user's UID and tenant ID, or null if not found.
 */
export async function findUserByLocalMessageId(db: Firestore, localMessageId: string): Promise<{ uid: string; tenantId: string } | null> {
    const logsQuery = db.collectionGroup('messagelogs').where('id', '==', localMessageId) as Query<DocumentData>;
    const snapshot = await logsQuery.get();

    if (snapshot.empty) {
        return null;
    }

    const logDoc = snapshot.docs[0];
    const tenantId = logDoc.data().tenantId;
    const uid = logDoc.ref.parent.parent?.id;

    if (uid && tenantId) {
        return { uid, tenantId };
    }

    return null;
}


/**
 * Adds an incoming message to the appropriate user's message log.
 * @param db The Firestore admin instance.
 * @param uid The user's ID.
 * @param tenant The tenant who sent the message.
 * @param message The content of the message.
 * @param date The timestamp of the message.
 * @param providerId The ID from the messaging provider.
 */
export async function addIncomingMessageToLog(db: Firestore, uid: string, tenant: Tenant, message: string, date: string, providerId: string) {
    const logData = {
        id: providerId,
        providerId: providerId,
        tenantId: tenant.id,
        tenantName: tenant.name,
        message: message,
        date: date,
        method: 'SMS',
        direction: 'incoming',
        status: 'Received',
    };

    await db.collection('users').doc(uid).collection('messagelogs').doc(providerId).set(logData);
    console.log(`[Webhook] Stored incoming message for user ${uid}, tenant ${tenant.id}`);
}

/**
 * Updates the delivery status of an outgoing message.
 * @param db The Firestore admin instance.
 * @param uid The user's ID.
 * @param localMessageId The original local ID of the message.
 * @param status The new delivery status.
 * @param providerId The final ID from the provider.
 */
export async function updateMessageDeliveryStatus(db: Firestore, uid: string, localMessageId: string, status: string, providerId: string) {
    const messageRef = db.collection('users').doc(uid).collection('messagelogs').doc(localMessageId);

    await messageRef.update({
        status: status,
        providerId: providerId,
    });
    console.log(`[Webhook] Updated status for local message ${localMessageId} to ${status}`);
}
