
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { Template } from '@/lib/types';
import { initialTemplates } from '@/lib/data';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';

type TemplateContextType = {
  activeTemplates: Template[];
  trashedTemplates: Template[];
  addTemplate: (template: Omit<Template, 'id' | 'status'>) => void;
  trashTemplate: (id: string) => void;
  restoreTemplate: (id: string) => void;
  permanentlyDeleteTemplate: (id: string) => void;
  isInitialized: boolean;
};

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const templatesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'templates');
  }, [firestore, user]);

  const { data: templatesData, isLoading: isTemplatesLoading } = useCollection<Template>(templatesCollection);

  const { activeTemplates, trashedTemplates } = useMemo(() => {
    const active: Template[] = [];
    const trashed: Template[] = [];
    (templatesData || []).forEach(t => {
      if (t.status === 'trashed') {
        trashed.push(t);
      } else {
        active.push(t);
      }
    });
    return { activeTemplates: active, trashedTemplates: trashed };
  }, [templatesData]);

  const addTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'status'>) => {
    if (!templatesCollection) {
      console.error("Templates collection not available. Cannot add template.");
      return;
    }
    const newDocRef = doc(templatesCollection);
    const newTemplate: Template = {
        ...templateData,
        id: newDocRef.id,
        status: 'active',
    };
    await setDoc(newDocRef, newTemplate);
  }, [templatesCollection]);

  const updateTemplateStatus = useCallback(async (id: string, status: 'active' | 'trashed') => {
    if (!templatesCollection) return;
    const docRef = doc(templatesCollection, id);
    await updateDoc(docRef, { status });
  }, [templatesCollection]);

  const trashTemplate = (id: string) => updateTemplateStatus(id, 'trashed');
  const restoreTemplate = (id: string) => updateTemplateStatus(id, 'active');

  const permanentlyDeleteTemplate = useCallback(async (id: string) => {
    if (!templatesCollection) return;
    const docRef = doc(templatesCollection, id);
    await deleteDoc(docRef);
  }, [templatesCollection]);
  
  // Seed initial templates if the user has none
  useEffect(() => {
    if (user && templatesCollection && !isTemplatesLoading && templatesData && templatesData.length === 0) {
      initialTemplates.forEach(async (template) => {
        const docRef = doc(templatesCollection, template.id);
        await setDoc(docRef, template);
      });
    }
  }, [user, templatesCollection, isTemplatesLoading, templatesData]);

  const isInitialized = !isUserLoading && !isTemplatesLoading;

  const value = {
    activeTemplates,
    trashedTemplates,
    addTemplate,
    trashTemplate,
    restoreTemplate,
    permanentlyDeleteTemplate,
    isInitialized
  };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}
