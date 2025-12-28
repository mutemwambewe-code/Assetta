'use client';

import { useState, useEffect } from 'react';
import { useTenants } from './tenant-provider';
import type { Invoice } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusStyles: { [key: string]: string } = {
  paid: 'bg-accent text-accent-foreground',
  sent: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  overdue: 'bg-destructive/20 text-destructive',
  draft: 'bg-muted text-muted-foreground',
};

export function InvoiceHistory({ tenantId }: { tenantId: string }) {
  const { getInvoicesForTenant } = useTenants();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      const tenantInvoices = await getInvoicesForTenant(tenantId);
      const sortedInvoices = tenantInvoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
      setInvoices(sortedInvoices);
      setIsLoading(false);
    };

    fetchInvoices();
  }, [tenantId, getInvoicesForTenant]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
        <CardDescription>A list of all invoices sent to this tenant.</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">{invoice.id.substring(0, 8)}...</TableCell>
                  <TableCell>{format(new Date(invoice.issueDate), 'PPP')}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'PPP')}</TableCell>
                  <TableCell className="text-right font-medium">
                    ZMW {invoice.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn('capitalize', statusStyles[invoice.status])}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold mt-4">No Invoices Sent</h2>
            <p className="text-muted-foreground mt-2">This tenant has not been sent any invoices yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
