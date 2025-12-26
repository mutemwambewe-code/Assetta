'use server';
/**
 * @fileOverview Defines AI tools for the Assetta assistant to interact with application data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { headers } from 'next/headers';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import type { Tenant } from '@/lib/types';


// Server-side Firebase Admin SDK initialization
function getAdminSdks(): { auth: Auth; firestore: Firestore } {
  if (!getApps().length) {
    // In a deployed Google Cloud environment, service account credentials will be automatically discovered.
    initializeApp();
  }
  return { auth: getAdminAuth(), firestore: getFirestore() };
}


// This is a server-side representation. We can't use the client-side providers here.
// We will fetch directly from Firestore. This requires a way to get the current user's UID.
async function getUid() {
    const authHeader = headers().get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthenticated: No Authorization header provided.');
    }
    const match = authHeader.match(/^Bearer (.*)$/);
    if (!match) {
      throw new Error('Unauthenticated: Invalid Authorization header format.');
    }
    const idToken = match[1];
    const { auth } = getAdminSdks();
    try {
        const decodedToken = await auth.verifyIdToken(idToken, true);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        throw new Error('Unauthenticated: Invalid or expired token.');
    }
}

async function getTenants(status?: 'Paid' | 'Pending' | 'Overdue') {
    const uid = await getUid();
    const { firestore } = getAdminSdks();
    
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore.collection(`users/${uid}/tenants`);

    if (status) {
        q = q.where('rentStatus', '==', status);
    }
    
    const snapshot = await q.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
}

async function getProperties() {
    const uid = await getUid();
    const { firestore } = getAdminSdks();

    const q = firestore.collection(`users/${uid}/properties`);
    const snapshot = await q.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const listTenants = ai.defineTool(
    {
      name: 'listTenants',
      description: 'Get a list of tenants. Can be filtered by rent payment status.',
      inputSchema: z.object({
        status: z.enum(['Paid', 'Pending', 'Overdue']).optional().describe("The rent status to filter tenants by."),
      }),
      outputSchema: z.array(z.object({
        name: z.string(),
        property: z.string(),
        unit: z.string(),
        rentStatus: z.string(),
        rentAmount: z.number(),
      })),
    },
    async (input) => {
      console.log(`[AI Tool] Listing tenants with status: ${input.status || 'any'}`);
      const tenants = await getTenants(input.status);
      return tenants.map(t => ({
          name: t.name,
          property: t.property,
          unit: t.unit,
          rentStatus: t.rentStatus,
          rentAmount: t.rentAmount,
      }));
    }
);

export const listProperties = ai.defineTool(
    {
        name: 'listProperties',
        description: 'Get a list of all properties.',
        inputSchema: z.object({}),
        outputSchema: z.array(z.object({
            name: z.string(),
            location: z.string(),
            units: z.number(),
        })),
    },
    async () => {
        console.log('[AI Tool] Listing all properties');
        const properties = await getProperties();
        return properties.map((p: any) => ({
            name: p.name,
            location: p.location,
            units: p.units,
        }));
    }
);

export const getTenantByName = ai.defineTool(
    {
        name: 'getTenantByName',
        description: 'Get detailed information about a specific tenant by their name.',
        inputSchema: z.object({
            name: z.string().describe("The full name of the tenant to search for."),
        }),
        outputSchema: z.object({
            name: z.string(),
            property: z.string(),
            unit: z.string(),
            rentStatus: z.string(),
            rentAmount: z.number(),
            leaseEndDate: z.string(),
            phone: z.string(),
        }).optional(),
    },
    async (input) => {
        console.log(`[AI Tool] Getting tenant by name: ${input.name}`);
        const tenants = await getTenants();
        const tenant = tenants.find(t => t.name.toLowerCase() === input.name.toLowerCase());
        
        if (!tenant) return undefined;

        return {
            name: tenant.name,
            property: tenant.property,
            unit: tenant.unit,
            rentStatus: tenant.rentStatus,
            rentAmount: tenant.rentAmount,
            leaseEndDate: tenant.leaseEndDate,
            phone: tenant.phone,
        };
    }
);
