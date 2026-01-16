
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tenant, Payment } from '@/lib/types';
import { format, startOfMonth, isWithinInterval } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FinancialReportProps {
  payments: Payment[];
  tenants: Tenant[];
}

const statusStyles = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;


export function FinancialReport({ payments, tenants }: FinancialReportProps) {
  const router = useRouter();

  const { paidThisMonth, unpaidThisMonth } = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    
    const paidTenantsInfo: { tenant: Tenant, payment: Payment }[] = [];
    const unpaidTenants: Tenant[] = [];

    tenants.forEach(tenant => {
        const paymentsThisMonth = (tenant.paymentHistory || []).filter(p => 
            isWithinInterval(new Date(p.date), { start: currentMonthStart, end: new Date() })
        );

        if (tenant.rentStatus === 'Paid') {
            const lastPayment = paymentsThisMonth.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if(lastPayment) {
                paidTenantsInfo.push({ tenant, payment: lastPayment });
            }
        } else if (new Date(tenant.leaseEndDate) >= currentMonthStart) {
            unpaidTenants.push(tenant);
        }
    });

    return { paidThisMonth: paidTenantsInfo, unpaidThisMonth: unpaidTenants };
  }, [tenants]);

  const handleRowClick = (tenantId: string) => {
    router.push(`/tenants/${tenantId}`);
  };

  return (
    <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paid This Month</CardTitle>
            <CardDescription>Tenants who have paid rent in {format(new Date(), 'MMMM yyyy')}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className='text-right'>Amount</TableHead>
                  <TableHead className='text-right'>Date Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidThisMonth.length > 0 ? paidThisMonth.map(({ tenant, payment }) => (
                  <TableRow key={payment.id} onClick={() => handleRowClick(tenant.id)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <Avatar className="h-9 w-9">
                            {tenant.avatarUrl && <AvatarImage asChild src={tenant.avatarUrl}><Image src={tenant.avatarUrl} alt={tenant.name} width={36} height={36} /></AvatarImage>}
                            <AvatarFallback>{tenant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{tenant.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>ZMW {payment.amount.toLocaleString()}</TableCell>
                    <TableCell className='text-right'>{format(new Date(payment.date), 'MMM dd')}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No payments recorded this month.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Unpaid This Month</CardTitle>
            <CardDescription>Active tenants who have not yet paid for {format(new Date(), 'MMMM yyyy')}.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className='text-right'>Rent</TableHead>
                  <TableHead className='text-right'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidThisMonth.length > 0 ? unpaidThisMonth.map((tenant) => (
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
                    <TableCell className='text-right'>ZMW {tenant.rentAmount.toLocaleString()}</TableCell>
                    <TableCell className='text-right'>
                       <Link href={`/communication?tenantId=${tenant.id}`}>
                        <Badge variant={statusStyles[tenant.rentStatus]} className="text-xs">
                            {tenant.rentStatus}
                        </Badge>
                       </Link>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      All tenants have paid. Well done!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
