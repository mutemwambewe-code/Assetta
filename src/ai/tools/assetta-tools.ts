
'use server';
/**
 * @fileOverview Defines AI tools for the Assetta assistant to interact with application data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Tenant } from '@/lib/types';
import { firebaseConfig } from '@/firebase/config';


// Server-side Firebase Admin SDK initialization
let adminApp: App;
function getAdminFirestore(): Firestore {
  if (!getApps().length) {
    // In a local development environment authenticated with gcloud,
    // initializeApp() will automatically use the Application Default Credentials.
    adminApp = initializeApp();
  } else {
    adminApp = getApps()[0];
  }
  return getFirestore(adminApp);
}

async function getTenants(uid: string, status?: 'Paid' | 'Pending' | 'Overdue') {
    const firestore = getAdminFirestore();
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore.collection(`users/${uid}/tenants`);

    if (status) {
        q = q.where('rentStatus', '==', status);
    }
    
    const snapshot = await q.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[];
}

async function getProperties(uid: string) {
    const firestore = getAdminFirestore();
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
        uid: z.string().describe("The user's unique ID."),
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
      console.log(`[AI Tool] Listing tenants for user ${input.uid} with status: ${input.status || 'any'}`);
      const tenants = await getTenants(input.uid, input.status);
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
        inputSchema: z.object({
            uid: z.string().describe("The user's unique ID."),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            location: z.string(),
            units: z.number(),
        })),
    },
    async (input) => {
        console.log(`[AI Tool] Listing all properties for user ${input.uid}`);
        const properties = await getProperties(input.uid);
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
            uid: z.string().describe("The user's unique ID."),
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
        console.log(`[AI Tool] Getting tenant by name: ${input.name} for user ${input.uid}`);
        const tenants = await getTenants(input.uid);
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
