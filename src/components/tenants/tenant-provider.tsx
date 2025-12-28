'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Tenant, Payment, Invoice } from '@/lib/types';
import { isAfter, startOfMonth, parseISO, isWithinInterval, addDays, differenceInDays } from 'date-fns';
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

const calculateRentDetails = (tenant: Tenant): { rentStatus: Tenant['rentStatus'], nextDueDate?: string } => {
  const today = new Date();
  
  if (!tenant.paymentHistory || tenant.paymentHistory.length === 0) {
    const leaseStart = parseISO(tenant.leaseStartDate);
    const daysSinceLeaseStart = differenceInDays(today, leaseStart);
    if (daysSinceLeaseStart > 30) {
      return { rentStatus: 'Overdue' };
    }
    return { rentStatus: 'Pending', nextDueDate: addDays(leaseStart, 30).toISOString() };
  }

  const lastPayment = tenant.paymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const lastPaymentDate = parseISO(lastPayment.date);
  const nextDueDate = addDays(lastPaymentDate, 30);

  if (isAfter(today, nextDueDate)) {
    return { rentStatus: 'Overdue', nextDueDate: nextDueDate.toISOString() };
  }

  const daysUntilDue = differenceInDays(nextDueDate, today);
  if (daysUntilDue <= 7) {
    return { rentStatus: 'Pending', nextDueDate: nextDueDate.toISOString() };
  }

  return { rentStatus: 'Paid', nextDueDate: nextDueDate.toISOString() };
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
      const { rentStatus, nextDueDate } = calculateRentDetails(tenant);
      const property = properties.find(p => p.name === tenant.property);
      return {
        ...tenant,
        rentStatus,
        nextDueDate,
        paymentHistory: tenant.paymentHistory || [],
        propertyId: property?.id,
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
    const { rentStatus, nextDueDate } = calculateRentDetails(newTenant as Tenant);
    const tenantWithStatus: Tenant = {
        ...(newTenant as Tenant),
        rentStatus,
        nextDueDate,
    }
    await setDoc(newDocRef, tenantWithStatus);
  }, [tenantsCollection, properties]);

  const updateTenant = useCallback(async (tenant: Tenant) => {
    if (!tenantsCollection) return;
    const docRef = doc(tenantsCollection, tenant.id);
    const { rentStatus, nextDueDate } = calculateRentDetails(tenant);
    const tenantWithStatus = {
        ...tenant,
        rentStatus,
        nextDueDate
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
        paymentHistory: [newPayment, ...(tenant.paymentHistory || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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
