
'use client';

import { createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Tenant, Payment } from '@/lib/types';
import { isAfter, startOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type TenantContextType = {
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id' | 'avatarUrl' | 'rentStatus' | 'paymentHistorySummary' | 'paymentHistory'>) => void;
  updateTenant: (tenant: Tenant) => void;
  deleteTenant: (tenantId: string) => void;
  logPayment: (tenantId: string, payment: Omit<Payment, 'id'>) => void;
  isInitialized: boolean;
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const updateRentStatusForTenant = (tenant: Tenant): Tenant['rentStatus'] => {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);

  const totalPaidThisMonth = (tenant.paymentHistory || [])
    .filter(p => isWithinInterval(parseISO(p.date), { start: currentMonthStart, end: new Date() }))
    .reduce((sum, p) => sum + p.amount, 0);

  if (totalPaidThisMonth >= tenant.rentAmount) {
    return 'Paid';
  }
  
  const leaseEndDate = parseISO(tenant.leaseEndDate);
  if (isAfter(today, leaseEndDate)) {
      const finalMonthStart = startOfMonth(leaseEndDate);
      const totalPaidFinalMonth = (tenant.paymentHistory || [])
        .filter(p => isWithinInterval(parseISO(p.date), { start: finalMonthStart, end: leaseEndDate }))
        .reduce((sum, p) => sum + p.amount, 0);
      
      if(totalPaidFinalMonth < tenant.rentAmount) return 'Overdue';
      return 'Paid';
  }

  const leaseStartDate = parseISO(tenant.leaseStartDate);
  if (isAfter(currentMonthStart, leaseStartDate) || (isWithinInterval(leaseStartDate, {start: currentMonthStart, end: today}) && leaseStartDate.getDate() <= 5) ) {
      if (today.getDate() > 5) {
           return 'Overdue';
      }
  }

  return 'Pending';
};


export function TenantProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const tenantsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'tenants');
  }, [firestore, user]);

  const { data: tenantsData, isLoading: isTenantsLoading } = useCollection<Tenant>(tenantsCollection);

  const tenants = useMemo(() => {
    return (tenantsData || []).map(tenant => ({
      ...tenant,
      rentStatus: updateRentStatusForTenant(tenant),
      paymentHistory: tenant.paymentHistory || []
    }));
  }, [tenantsData]);

  const addTenant = useCallback(async (tenantData: Omit<Tenant, 'id' | 'avatarUrl' | 'rentStatus' | 'paymentHistorySummary' | 'paymentHistory'>) => {
    if (!tenantsCollection) {
      console.error("Tenants collection not available. Cannot add tenant.");
      return;
    }
    const newDocRef = doc(tenantsCollection);
    const newTenant: Tenant = {
        ...tenantData,
        email: tenantData.email || '',
        id: newDocRef.id,
        avatarUrl: '',
        rentStatus: 'Pending',
        paymentHistorySummary: 'New tenant.',
        paymentHistory: [],
    };
    const tenantWithStatus = {
        ...newTenant,
        rentStatus: updateRentStatusForTenant(newTenant),
    }
    await setDoc(newDocRef, tenantWithStatus);
  }, [tenantsCollection]);

  const updateTenant = useCallback(async (tenant: Tenant) => {
    if (!tenantsCollection) return;
    const docRef = doc(tenantsCollection, tenant.id);
    const tenantWithStatus = {
        ...tenant,
        rentStatus: updateRentStatusForTenant(tenant),
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

  const isInitialized = !isUserLoading && !isTenantsLoading;

  const value = {
    tenants,
    addTenant,
    updateTenant,
    deleteTenant,
    logPayment,
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
