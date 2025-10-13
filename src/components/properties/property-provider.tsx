'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { Property } from '@/lib/types';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type PropertyContextType = {
  properties: Property[];
  addProperty: (property: Omit<Property, 'id' | 'occupied'>) => Property;
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

  const addProperty = useCallback((propertyData: Omit<Property, 'id' | 'occupied'>): Property => {
    if (!propertiesCollection) {
        throw new Error("Properties collection not available.");
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
    if (!propertiesCollection) return;
    const docRef = doc(propertiesCollection, propertyId);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }, [propertiesCollection]);

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
