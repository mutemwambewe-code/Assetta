'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { UtilityBill } from '@/lib/types';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { isAfter, startOfDay, parseISO } from 'date-fns';

type UtilityContextType = {
  utilityBills: UtilityBill[];
  addUtilityBill: (bill: Omit<UtilityBill, 'id' | 'status'>) => void;
  updateUtilityBill: (bill: UtilityBill) => void;
  deleteUtilityBill: (billId: string) => void;
  isInitialized: boolean;
};

const UtilityContext = createContext<UtilityContextType | undefined>(undefined);

export function UtilityProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const billsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'utilitybills');
  }, [firestore, user]);

  const { data: billsData, isLoading: isBillsLoading } = useCollection<UtilityBill>(billsCollection);

  const utilityBills = useMemo(() => {
    return (billsData || []).map(bill => {
      const today = startOfDay(new Date());
      const dueDate = startOfDay(parseISO(bill.dueDate));
      let status: UtilityBill['status'] = bill.status;

      // Automatically determine status if not already paid
      if (status !== 'Paid') {
          if (isAfter(today, dueDate)) {
              status = 'Overdue';
          } else {
              status = 'Pending';
          }
      }

      return { ...bill, status };
    }).sort((a,b) => new Date(b.billingPeriodStart).getTime() - new Date(a.billingPeriodStart).getTime());
  }, [billsData]);


  const addUtilityBill = useCallback(async (billData: Omit<UtilityBill, 'id' | 'status'>) => {
    if (!billsCollection) return;
    const newDocRef = doc(billsCollection);
    const newBill: UtilityBill = {
      ...billData,
      id: newDocRef.id,
      status: 'Pending', // Initial status
    };
    await setDoc(newDocRef, newBill);
  }, [billsCollection]);

  const updateUtilityBill = useCallback(async (bill: UtilityBill) => {
    if (!billsCollection) return;
    const docRef = doc(billsCollection, bill.id);
    await setDoc(docRef, bill, { merge: true });
  }, [billsCollection]);

  const deleteUtilityBill = useCallback((billId: string) => {
    if (!billsCollection) return;
    const docRef = doc(billsCollection, billId);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }, [billsCollection]);


  const isInitialized = !isUserLoading && !isBillsLoading;

  const value = {
    utilityBills,
    addUtilityBill,
    updateUtilityBill,
    deleteUtilityBill,
    isInitialized
  };

  return <UtilityContext.Provider value={value}>{children}</UtilityContext.Provider>;
}

export function useUtility() {
  const context = useContext(UtilityContext);
  if (context === undefined) {
    throw new Error('useUtility must be used within a UtilityProvider');
  }
  return context;
}
