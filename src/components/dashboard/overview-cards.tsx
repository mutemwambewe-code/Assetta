
'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Home, Users, AlertTriangle, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { useTenants } from '../tenants/tenant-provider';
import { isWithinInterval, addDays, startOfMonth, parseISO, isBefore, endOfMonth, getMonth, getYear } from 'date-fns';
import { useProperties } from '../properties/property-provider';

export function OverviewCards() {
    const { tenants } = useTenants();
    const { properties } = useProperties();
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);

    const occupiedUnits = tenants.length;
    const overdueTenants = tenants.filter(t => t.rentStatus === 'Overdue').length;

    const today = new Date();
    const next30Days = addDays(today, 30);
    const currentMonthStart = startOfMonth(today);

    const rentCollected = tenants
        .flatMap(t => t.paymentHistory)
        .filter(p => {
            const paymentDate = parseISO(p.date);
            // Ensure payment is within the current calendar month and year
            return getMonth(paymentDate) === getMonth(today) && getYear(paymentDate) === getYear(today);
        })
        .reduce((sum, p) => sum + p.amount, 0);

    const rentPending = tenants
        .filter(t => t.rentStatus === 'Pending' || t.rentStatus === 'Overdue')
        .reduce((sum, t) => sum + t.rentAmount, 0);


    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0';

    const rentDueThisMonth = tenants
      .filter(tenant => {
        const leaseStart = parseISO(tenant.leaseStartDate);
        const leaseEnd = parseISO(tenant.leaseEndDate);
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        // Active if lease starts before end of month and ends after start of month
        return isBefore(leaseStart, monthEnd) && isBefore(monthStart, leaseEnd);
      })
      .reduce((sum, tenant) => sum + tenant.rentAmount, 0);

    const upcomingExpirations = tenants.filter(tenant => {
        const leaseEndDate = parseISO(tenant.leaseEndDate);
        return isWithinInterval(leaseEndDate, { start: today, end: next30Days });
    }).length;


    const cardData = [
    {
        title: 'Total Units',
        value: totalUnits,
        icon: Home,
        description: 'Across all properties',
        href: '/properties',
    },
    {
        title: 'Occupied Units',
        value: occupiedUnits,
        icon: Users,
        href: '/tenants',
        description: (
        <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-accent">{occupancyRate}%</span> occupancy
        </span>
        ),
    },
    {
        title: 'Rent Collected (Month)',
        value: `ZMW ${rentCollected.toLocaleString()}`,
        icon: DollarSign,
        description: `ZMW ${rentPending.toLocaleString()} outstanding`,
        href: '/reports',
    },
    {
        title: 'Rent Due (Month)',
        value: `ZMW ${rentDueThisMonth.toLocaleString()}`,
        icon: FileText,
        description: 'From all active leases',
        href: '/tenants?filter=Overdue,Pending',
    },
    {
        title: 'Tenants in Arrears',
        value: overdueTenants,
        icon: AlertTriangle,
        description: 'Require follow-up',
        className: 'text-yellow-600 dark:text-yellow-400',
        iconClassName: 'bg-yellow-500/10',
        href: '/tenants?filter=Overdue',
    },
    {
        title: 'Lease Expirations (30d)',
        value: upcomingExpirations,
        icon: Clock,
        description: 'Leases ending soon',
        className: 'text-blue-600 dark:text-blue-400',
        iconClassName: 'bg-blue-500/10',
        href: '/tenants',
    },
    ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cardData.map((card) => (
        <Link href={card.href} key={card.title} className="hover:scale-105 transition-transform">
          <Card>
            <CardContent className="p-4 flex items-start gap-4">
              <div className={cn("p-3 rounded-lg bg-secondary", card.iconClassName)}>
                  <card.icon className={cn('h-6 w-6 text-muted-foreground', card.className)} />
              </div>
              <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className={cn('text-2xl font-bold', card.className)}>
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
