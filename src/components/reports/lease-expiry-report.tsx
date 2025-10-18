
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tenant } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface LeaseExpiryReportProps {
  tenants: Tenant[];
}

export function LeaseExpiryReport({ tenants }: LeaseExpiryReportProps) {
  const router = useRouter();

  const expiringLeases = useMemo(() => {
    const today = new Date();
    return tenants
      .map(tenant => ({
        tenant,
        daysRemaining: differenceInDays(new Date(tenant.leaseEndDate), today),
      }))
      .filter(({ daysRemaining }) => daysRemaining >= 0 && daysRemaining <= 90)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [tenants]);

  const handleRowClick = (tenantId: string) => {
    router.push(`/tenants/${tenantId}`);
  };
  
  const getDaysRemainingColor = (days: number) => {
    if (days <= 30) return 'text-destructive';
    if (days <= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Lease Expirations</CardTitle>
        <CardDescription>Leases expiring in the next 90 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Expires On</TableHead>
              <TableHead className='text-right'>Days Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expiringLeases.length > 0 ? expiringLeases.map(({ tenant, daysRemaining }) => (
              <TableRow key={tenant.id} onClick={() => handleRowClick(tenant.id)} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                     <Avatar className="h-9 w-9">
                        {tenant.avatarUrl && <AvatarImage asChild src={tenant.avatarUrl}><Image src={tenant.avatarUrl} alt={tenant.name} width={36} height={36} /></AvatarImage>}
                        <AvatarFallback>{tenant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.property} - {tenant.unit}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(tenant.leaseEndDate), 'PPP')}</TableCell>
                <TableCell className={cn('text-right font-semibold', getDaysRemainingColor(daysRemaining))}>
                  {daysRemaining} days
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No leases expiring soon.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
