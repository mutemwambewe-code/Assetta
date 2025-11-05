
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMessageLog } from '@/components/communication/message-log-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Calendar, User, Tag, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

function MessageLogDetailPage({ title }: { title?: string }) {
  const params = useParams();
  const router = useRouter();
  const { messageLogs } = useMessageLog();
  
  const logId = params.logId as string;
  const log = messageLogs.find((l) => l.id === logId);

  if (!log) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Message Log Not Found</h3>
            <p className="text-sm text-muted-foreground">
                The message log you are looking for does not exist.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/communication')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Communication
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className='flex justify-between items-center'>
        <h1 className="text-2xl font-bold tracking-tight">Message Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Message to {log.tenantName}
          </CardTitle>
          <CardDescription>
            {log.direction === 'outgoing' ? 'Sent' : 'Received'} on {format(new Date(log.date), 'PPPp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-base whitespace-pre-wrap">{log.message}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground"/>
                    <div>
                        <p className="text-muted-foreground">Tenant</p>
                        <Link href={`/tenants/${log.tenantId}`} className="font-semibold text-primary hover:underline">
                            {log.tenantName}
                        </Link>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                    <div>
                        <p className="text-muted-foreground">Timestamp</p>
                        <p className="font-semibold">{format(new Date(log.date), 'PPp')}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground"/>
                    <div>
                        <p className="text-muted-foreground">Method</p>
                        <p className="font-semibold">{log.method}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                     {log.status === 'Success' || log.status === 'Received' ? (
                        <CheckCircle className="h-4 w-4 text-accent" />
                     ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                     )}
                    <div>
                        <p className="text-muted-foreground">Status</p>
                         <Badge variant={log.status === 'Success' || log.status === 'Received' ? 'default' : 'destructive'}>
                            {log.status || 'Unknown'}
                        </Badge>
                    </div>
                </div>
                 {log.providerId && log.providerId !== log.id && (
                     <div className="flex items-center gap-3 sm:col-span-2">
                        <Tag className="h-4 w-4 text-muted-foreground"/>
                        <div>
                            <p className="text-muted-foreground">Provider ID</p>
                            <p className="font-mono text-xs">{log.providerId}</p>
                        </div>
                    </div>
                 )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

MessageLogDetailPage.title = "Message Details";
export default MessageLogDetailPage;
