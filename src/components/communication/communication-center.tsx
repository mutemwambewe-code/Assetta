'use client';

import { useState, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, MessagesSquare, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

// Dynamically import each tab's content
const AutomatedReminder = dynamic(
  () => import('@/components/communication/automated-reminder').then(mod => mod.AutomatedReminder),
  {
    loading: () => <Skeleton className="h-[500px] w-full" />,
    ssr: false,
  }
);

const InvoiceComposer = dynamic(
  () => import('@/components/communication/invoice-composer').then(mod => mod.InvoiceComposer),
  {
    loading: () => <Skeleton className="h-[500px] w-full" />,
    ssr: false,
  }
);

const MessageLogs = dynamic(
  () => import('@/components/communication/message-logs').then(mod => mod.MessageLogs),
  {
    loading: () => <Skeleton className="h-[500px] w-full" />,
    ssr: false,
  }
);

export function CommunicationCenter() {
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'compose');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['compose', 'invoice', 'logs'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', value);
    window.history.pushState({ ...window.history.state, as: newUrl.pathname + newUrl.search, url: newUrl.pathname + newUrl.search }, '', newUrl);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communication Center</h1>
          <p className="text-muted-foreground">
            Compose messages, create invoices, and view communication history.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">
            <MessagesSquare className="mr-2 h-4 w-4" />
            SMS Reminders
          </TabsTrigger>
          <TabsTrigger value="invoice">
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="mr-2 h-4 w-4" />
            Message Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <AutomatedReminder message={message} setMessage={setMessage} />
          </Suspense>
        </TabsContent>
        <TabsContent value="invoice">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <InvoiceComposer />
          </Suspense>
        </TabsContent>
        <TabsContent value="logs">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <MessageLogs />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
