
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

const getPastSixMonths = () => {
    const months = [];
    const date = new Date();
    date.setDate(1);
    for (let i = 0; i < 6; i++) {
        months.unshift(new Date(date));
        date.setMonth(date.getMonth() - 1);
    }
    return months;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 text-sm shadow-lg">
          <p className="font-bold">{label}</p>
          <p style={{ color: 'hsl(var(--chart-2))' }}>
            Collected: ZMW {payload[0].value.toLocaleString()}
          </p>
        </Card>
      );
    }
    return null;
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const statusStyles = {
  Paid: 'bg-accent text-accent-foreground border-transparent',
  Pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400',
  Overdue: 'bg-destructive/20 text-destructive border-destructive/30',
};


export function FinancialReport({ payments, tenants }: FinancialReportProps) {
  const router = useRouter();

  const monthlyIncomeData = useMemo(() => {
    const months = getPastSixMonths();
    return months.map(month => {
      const monthKey = format(month, 'MMM');
      const year = month.getFullYear();
      
      const collectedForMonth = payments
        .filter(p => {
          const paymentDate = new Date(p.date);
          return paymentDate.getMonth() === month.getMonth() && paymentDate.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        month: monthKey,
        collected: collectedForMonth,
      };
    });
  }, [payments]);

  const paymentMethodData = useMemo(() => {
    const methodCounts = payments.reduce((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([name, value]) => ({ name, value }));
  }, [payments]);

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
    <div className="grid grid-cols-1 gap-6 mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>Rent collected over the past 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyIncomeData}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `ZMW ${value / 1000}k`} />
                <Tooltip cursor={{ fill: 'hsla(var(--card-foreground) / 0.1)' }} content={<CustomTooltip />} />
                <Bar dataKey="collected" fill="hsl(var(--chart-2))" name="Rent Collected" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution of payment methods used by tenants.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                    {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip cursor={false} />
                <Legend />
                </PieChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <Badge className={cn('text-xs', statusStyles[tenant.rentStatus])}>
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

    </div>
  );
}
