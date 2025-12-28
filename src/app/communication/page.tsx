
'use client';

import { AutomatedReminder } from "@/components/communication/automated-reminder";
import { MessageLogs } from "@/components/communication/message-logs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, MessagesSquare, ArrowLeft, FileText } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceComposer } from "@/components/communication/invoice-composer";

function CommunicationPage({ title }: { title?: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'compose';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
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
          <Suspense fallback={<div>Loading composer...</div>}>
            <AutomatedReminder message={message} setMessage={setMessage} />
          </Suspense>
        </TabsContent>
         <TabsContent value="invoice">
            <InvoiceComposer />
        </TabsContent>
        <TabsContent value="logs">
            <MessageLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

CommunicationPage.title = 'Communication Center';
export default CommunicationPage;
