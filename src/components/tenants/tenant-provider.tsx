'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Tenant, Payment, Invoice } from '@/lib/types';
import { isAfter, startOfMonth, parseISO, isWithinInterval, addDays, differenceInDays, addMonths, isBefore, startOfDay } from 'date-fns';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useProperties } from '../properties/property-provider';

type TenantContextType = {
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id' | 'avatarUrl' | 'rentStatus' | 'paymentHistorySummary' | 'paymentHistory' | 'nextDueDate'>) => void;
  updateTenant: (tenant: Tenant) => void;
  deleteTenant: (tenantId: string) => void;
  logPayment: (tenantId: string, payment: Omit<Payment, 'id'>) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<Invoice | undefined>;
  getInvoicesForTenant: (tenantId: string) => Promise<Invoice[]>;
  isInitialized: boolean;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const calculateRentDetails = (tenant: Tenant): { rentStatus: Tenant['rentStatus'], nextDueDate?: string, balance: number } => {
  const today = startOfDay(new Date());
  const leaseStart = startOfDay(parseISO(tenant.leaseStartDate));
  const rentAmount = tenant.rentAmount;

  // 1. Calculate Total Rent Due (incurred up to today)
  let simulatedDate = leaseStart;
  let monthsDue = 0;
  // Rent is due at the START of the period.
  // If today is exactly the due date, it is due.
  while (isBefore(simulatedDate, today) || simulatedDate.getTime() === today.getTime()) {
    monthsDue++;
    simulatedDate = addMonths(simulatedDate, 1);
  }
  const totalRentDue = monthsDue * rentAmount;

  // 2. Calculate Total Paid
  const totalPaid = (tenant.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);

  // 3. Balance (Positive = Owed, Negative = Credit)
  const balance = totalRentDue - totalPaid;

  // 4. Determine Status and Next Due Date
  let rentStatus: Tenant['rentStatus'] = 'Paid';
  let nextDueDate = simulatedDate; // Default to next future period

  if (balance > 0) {
    // Determine the oldest unpaid due date
    // We essentially "fill up" the buckets from the start.
    // totalPaid covers X months fully.
    const fullyPaidMonths = Math.floor(totalPaid / rentAmount);
    const oldestUnpaidDate = addMonths(leaseStart, fullyPaidMonths);

    // Check grace period logic (e.g., 7 days)
    const gracePeriodEnd = addDays(oldestUnpaidDate, 7);

    if (isBefore(today, gracePeriodEnd)) {
      rentStatus = 'Pending';
    } else {
      rentStatus = 'Overdue';
    }

    // For display, the "Next Due" is the oldest one making them overdue
    nextDueDate = oldestUnpaidDate;
  } else {
    rentStatus = 'Paid';
    // If paid up, the next due date is the start of the next period that isn't fully covered?
    // Or simply the next calendar month start?
    // Example: Paid exactly 1 month. Balance 0.
    // fullyPaidMonths = 1. nextDueDate = start + 1 month.
    // If today is within that first month, next due is indeed the start of next.

    const fullyPaidMonths = Math.floor(totalPaid / rentAmount);
    // If balance < 0 (credit), they might have paid for months in future.
    // But usually next due is just the next chronological one.
    nextDueDate = addMonths(leaseStart, fullyPaidMonths);
  }

  return {
    rentStatus,
    nextDueDate: nextDueDate.toISOString(),
    balance
  };
};


export function TenantProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { properties } = useProperties();

  const tenantsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'tenants');
  }, [firestore, user]);

  const invoicesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'invoices');
  }, [firestore, user]);

  const { data: tenantsData, isLoading: isTenantsLoading } = useCollection<Tenant>(tenantsCollection);

  const tenants = useMemo(() => {
    return (tenantsData || []).map(tenant => {
      const { rentStatus, nextDueDate, balance } = calculateRentDetails(tenant);
      const property = properties.find(p => p.name === tenant.property);
      return {
        ...tenant,
        rentStatus,
        nextDueDate,
        paymentHistory: tenant.paymentHistory || [],
        propertyId: property?.id,
        balance,
      }
    });
  }, [tenantsData, properties]);

  const addTenant = useCallback(async (tenantData: Omit<Tenant, 'id' | 'avatarUrl' | 'rentStatus' | 'paymentHistorySummary' | 'paymentHistory' | 'nextDueDate'>) => {
    if (!tenantsCollection) {
      console.error("Tenants collection not available. Cannot add tenant.");
      return;
    }
    const newDocRef = doc(tenantsCollection);
    const property = properties.find(p => p.name === tenantData.property);

    const newTenant: Omit<Tenant, 'rentStatus' | 'nextDueDate'> & { paymentHistory: Payment[] } = {
      ...tenantData,
      email: tenantData.email || '',
      id: newDocRef.id,
      avatarUrl: '',
      paymentHistorySummary: 'New tenant.',
      paymentHistory: [],
      propertyId: property?.id,
    };
    const { rentStatus, nextDueDate, balance } = calculateRentDetails(newTenant as Tenant);
    const tenantWithStatus: Tenant = {
      ...(newTenant as Tenant),
      rentStatus,
      nextDueDate,
      balance,
    }
    await setDoc(newDocRef, tenantWithStatus);
  }, [tenantsCollection, properties]);

  const updateTenant = useCallback(async (tenant: Tenant) => {
    if (!tenantsCollection) return;
    const docRef = doc(tenantsCollection, tenant.id);
    const { rentStatus, nextDueDate, balance } = calculateRentDetails(tenant);
    const tenantWithStatus = {
      ...tenant,
      rentStatus,
      nextDueDate,
      balance
    }
    await setDoc(docRef, tenantWithStatus, { merge: true });
  }, [tenantsCollection]);

  const deleteTenant = useCallback((tenantId: string) => {
    if (!tenantsCollection) return;
    const docRef = doc(tenantsCollection, tenantId);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }, [tenantsCollection]);

  const logPayment = useCallback(async (tenantId: string, payment: Omit<Payment, 'id'>) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant || !tenantsCollection) return;

    const newPayment: Payment = {
      ...payment,
      id: `p${Date.now()}`
    }

    const updatedTenant: Tenant = {
      ...tenant,
      paymentHistory: [newPayment, ...(tenant.paymentHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }
    await updateTenant(updatedTenant);
  }, [tenants, tenantsCollection, updateTenant]);

  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'>) => {
    if (!invoicesCollection) {
      console.error("Invoices collection not available. Cannot add invoice.");
      return;
    }
    const newDocRef = doc(invoicesCollection);
    const newInvoice: Invoice = {
      ...invoiceData,
      id: newDocRef.id,
    };
    await setDoc(newDocRef, newInvoice);
    return newInvoice;
  }, [invoicesCollection]);

  const getInvoicesForTenant = useCallback(async (tenantId: string) => {
    if (!invoicesCollection) return [];
    const { getDocs, query, where } = await import('firebase/firestore');
    const q = query(invoicesCollection, where("tenantId", "==", tenantId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Invoice);
  }, [invoicesCollection]);

  const isInitialized = !isUserLoading && !isTenantsLoading;

  const value = {
    tenants,
    addTenant,
    updateTenant,
    deleteTenant,
    logPayment,
    addInvoice,
    getInvoicesForTenant,
    isInitialized
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenants() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenants must be used within a TenantProvider');
  }
  return context;
}
