
'use client';

import { AutomatedReminder } from "@/components/communication/automated-reminder";
import { MessageLogs } from "@/components/communication/message-logs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, MessagesSquare, ArrowLeft } from "lucide-react";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function CommunicationPage({ title }: { title?: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messaging</h1>
          <p className="text-muted-foreground">
            Compose, view, and manage your tenant communications.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </div>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose">
            <MessagesSquare className="mr-2 h-4 w-4" />
            Compose & Send
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
        <TabsContent value="logs">
            <MessageLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}

CommunicationPage.title = 'Messaging';
export default CommunicationPage;
