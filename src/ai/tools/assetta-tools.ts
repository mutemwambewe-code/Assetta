
'use server';
/**
 * @fileOverview Defines AI tools for the Assetta assistant to interact with application data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import type { Tenant, Property } from '@/lib/types';

// Server-side Firebase Admin SDK initialization
let adminApp: App | undefined;
function getAdminFirestore(): Firestore {
  if (adminApp) {
    return getFirestore(adminApp);
  }
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return getFirestore(adminApp);
  }
  try {
      // This works in deployed Google Cloud environments
      adminApp = initializeApp();
  } catch (e) {
      // This is the fallback for local development
      if (process.env.GCLOUD_PROJECT) {
          adminApp = initializeApp({ projectId: process.env.GCLOUD_PROJECT });
      } else {
          console.error("Firebase Admin SDK initialization failed. GCLOUD_PROJECT env var not set.");
          // In a real scenario, you might throw or handle this more gracefully
          // For now, we proceed, but Firestore calls will likely fail.
      }
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

async function getProperties(uid: string): Promise<Property[]> {
    const firestore = getAdminFirestore();
    const q = firestore.collection(`users/${uid}/properties`);
    const snapshot = await q.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
}

export const listTenants = ai.defineTool(
    {
      name: 'listTenants',
      description: 'Get a list of tenants. Can be filtered by rent payment status.',
      inputSchema: z.object({
        status: z.enum(['Paid', 'Pending', 'Overdue']).optional().describe("The rent status to filter tenants by."),
        uid: z.string().describe("The user's unique ID. This is handled automatically."),
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
            uid: z.string().describe("The user's unique ID. This is handled automatically."),
        }),
        outputSchema: z.array(z.object({
            name: z.string(),
            location: z.string(),
            units: z.number(),
            type: z.string(),
        })),
    },
    async (input) => {
        console.log(`[AI Tool] Listing all properties for user ${input.uid}`);
        const properties = await getProperties(input.uid);
        return properties.map((p: any) => ({
            name: p.name,
            location: p.location,
            units: p.units,
            type: p.type,
        }));
    }
);

export const getTenantByName = ai.defineTool(
    {
        name: 'getTenantByName',
        description: 'Get detailed information about a specific tenant by their name.',
        inputSchema: z.object({
            name: z.string().describe("The full name of the tenant to search for."),
            uid: z.string().describe("The user's unique ID. This is handled automatically."),
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

export const addTenant = ai.defineTool(
    {
        name: 'addTenant',
        description: 'Adds a new tenant to a property. The AI should ask the user for all the required information before calling this tool.',
        inputSchema: z.object({
            uid: z.string().describe("The user's unique ID. This is handled automatically."),
            name: z.string().describe("The tenant's full name."),
            phone: z.string().describe("The tenant's phone number, including country code."),
            email: z.string().optional().describe("The tenant's email address."),
            property: z.string().describe("The name of the property the tenant will live in."),
            unit: z.string().describe("The unit or room number."),
            rentAmount: z.number().describe("The monthly rent amount."),
            leaseStartDate: z.string().describe("The lease start date in YYYY-MM-DD format."),
            leaseEndDate: z.string().describe("The lease end date in YYYY-MM-DD format."),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async (input) => {
        console.log(`[AI Tool] Adding new tenant: ${input.name} for user ${input.uid}`);
        const firestore = getAdminFirestore();

        // Check if property exists
        const properties = await getProperties(input.uid);
        const propertyExists = properties.some(p => p.name === input.property);
        if (!propertyExists) {
            return { success: false, message: `The property "${input.property}" does not exist. Please add it first or select an existing property.` };
        }

        const tenantsCollection = firestore.collection(`users/${input.uid}/tenants`);
        const newDocRef = tenantsCollection.doc();
        const newTenant: Omit<Tenant, 'id'> = {
            name: input.name,
            phone: input.phone,
            email: input.email || '',
            property: input.property,
            unit: input.unit,
            rentAmount: input.rentAmount,
            leaseStartDate: input.leaseStartDate,
            leaseEndDate: input.leaseEndDate,
            avatarUrl: `https://picsum.photos/seed/${newDocRef.id}/200/200`, // Placeholder image
            rentStatus: 'Pending',
            paymentHistory: [],
            paymentHistorySummary: 'New tenant.',
        };
        
        await newDocRef.set(newTenant);
        
        return { success: true, message: `Successfully added tenant ${input.name}.` };
    }
);
