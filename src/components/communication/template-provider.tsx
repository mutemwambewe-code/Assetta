'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { Template } from '@/lib/types';
import { initialTemplates } from '@/lib/data';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';

type TemplateContextType = {
  templates: Template[];
  addTemplate: (template: Omit<Template, 'id'>) => void;
  deleteTemplate: (id: string) => void;
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

  const addTemplate = useCallback(async (templateData: Omit<Template, 'id'>) => {
    if (!templatesCollection) {
      console.error("Templates collection not available. Cannot add template.");
      return;
    }
    const newDocRef = doc(templatesCollection);
    const newTemplate: Template = {
        ...templateData,
        id: newDocRef.id
    };
    await setDoc(newDocRef, newTemplate);
  }, [templatesCollection]);

  const deleteTemplate = useCallback(async (id: string) => {
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
    templates: templatesData || [],
    addTemplate,
    deleteTemplate,
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
