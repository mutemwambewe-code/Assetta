'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { MessageLog } from '@/lib/types';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type MessageLogContextType = {
  messageLogs: MessageLog[];
  addMessageLog: (message: Omit<MessageLog, 'id'> & { id?: string }) => Promise<void>;
  updateMessageStatus: (localId: string, status: string, providerId?: string) => Promise<void>;
  isInitialized: boolean;
};

const MessageLogContext = createContext<MessageLogContextType | undefined>(undefined);

export function MessageLogProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const logsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'messagelogs');
  }, [firestore, user]);

  const { data: messageLogs, isLoading: isLogsLoading } = useCollection<MessageLog>(logsCollection);

  const sortedLogs = useMemo(() => {
    return (messageLogs || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [messageLogs]);

  const addMessageLog = useCallback(async (messageData: Omit<MessageLog, 'id'> & { id?: string }) => {
    if (!logsCollection) return;
    
    const localId = messageData.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const messageWithDirection: MessageLog = {
      direction: 'outgoing' as const,
      ...messageData,
      id: localId,
    };
    const docRef = doc(logsCollection, localId);
    await setDoc(docRef, messageWithDirection).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: messageWithDirection,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }, [logsCollection]);
  
  const updateMessageStatus = useCallback(async (localId: string, status: string, providerId?: string) => {
    if (!logsCollection) return;
    const docRef = doc(logsCollection, localId);
    
    const updateData: { status: string; providerId?: string } = { status };
    if (providerId) {
      updateData.providerId = providerId;
    }
    
    await updateDoc(docRef, updateData).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }, [logsCollection]);

  const isInitialized = !isUserLoading && !isLogsLoading;
  
  const value = {
    messageLogs: sortedLogs || [],
    addMessageLog,
    updateMessageStatus,
    isInitialized
  };

  return <MessageLogContext.Provider value={value}>{children}</MessageLogContext.Provider>;
}

export function useMessageLog() {
  const context = useContext(MessageLogContext);
  if (context === undefined) {
    throw new Error('useMessageLog must be used within a MessageLogProvider');
  }
  return context;
}
