'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { Property } from '@/lib/types';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type PropertyContextType = {
  properties: Property[];
  addProperty: (property: Omit<Property, 'id' | 'occupied'>) => Property | undefined;
  updateProperty: (property: Property) => void;
  deleteProperty: (propertyId: string) => void;
  isInitialized: boolean;
};

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const propertiesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'properties');
  }, [firestore, user]);

  const { data: properties, isLoading: isPropertiesLoading } = useCollection<Property>(propertiesCollection);

  const addProperty = useCallback((propertyData: Omit<Property, 'id' | 'occupied'>): Property | undefined => {
    if (!propertiesCollection) {
        console.error("Properties collection not available. Cannot add property.");
        return;
    };
    const newDocRef = doc(propertiesCollection);
    const newProperty: Property = {
        ...propertyData,
        id: newDocRef.id,
        occupied: 0,
    };
    setDoc(newDocRef, newProperty);
    return newProperty;
  }, [propertiesCollection]);

  const updateProperty = useCallback(async (property: Property) => {
    if (!propertiesCollection) return;
    const docRef = doc(propertiesCollection, property.id);
    await setDoc(docRef, property, { merge: true });
  }, [propertiesCollection]);

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!firestore || !user || !propertiesCollection) return;

    try {
        const batch = writeBatch(firestore);

        // 1. Delete the property document
        const propertyDocRef = doc(propertiesCollection, propertyId);
        batch.delete(propertyDocRef);

        // 2. Find and delete associated tenants
        const tenantsCollectionRef = collection(firestore, 'users', user.uid, 'tenants');
        const q = query(tenantsCollectionRef, where("propertyId", "==", propertyId));
        const tenantsSnapshot = await getDocs(q);
        
        tenantsSnapshot.forEach((tenantDoc) => {
            batch.delete(tenantDoc.ref);
        });

        // 3. Commit the batch
        await batch.commit();

    } catch (error: any) {
        console.error("Error deleting property and associated tenants:", error);
        // You can use a more specific error handling here if needed
         const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/properties/${propertyId}`,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, user, propertiesCollection]);


  const isInitialized = !isUserLoading && !isPropertiesLoading;

  const value = {
    properties: properties || [],
    addProperty,
    updateProperty,
    deleteProperty,
    isInitialized
  };

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
}
