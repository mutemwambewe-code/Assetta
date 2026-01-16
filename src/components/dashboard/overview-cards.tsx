
'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Home, Users, AlertTriangle, FileText, Clock, MoreVertical, TrendingUp, Eye, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenants } from '../tenants/tenant-provider';
import { isWithinInterval, addDays, startOfMonth, parseISO, isBefore, endOfMonth, getMonth, getYear } from 'date-fns';
import { useProperties } from '../properties/property-provider';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

export function OverviewCards() {
    const { tenants } = useTenants();
    const { properties } = useProperties();
    const router = useRouter();
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);

    const occupiedUnits = tenants.length;
    const tenantsInArrears = tenants.filter(t => t.rentStatus === 'Overdue' || t.rentStatus === 'Pending').length;

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

    const outstandingRent = tenants
        .filter(t => t.rentStatus === 'Pending' || t.rentStatus === 'Overdue')
        .reduce((sum, t) => sum + t.rentAmount, 0);


    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0';

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
        reportHref: '/reports?highlight=occupancy-report'
    },
    {
        title: 'Occupied Units',
        value: occupiedUnits,
        icon: Users,
        href: '/tenants',
        reportHref: '/reports?highlight=occupancy-report',
        description: (
        <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-accent">{occupancyRate}%</span> occupancy
        </span>
        ),
    },
    {
        title: 'Rent Collected (This Month)',
        value: `ZMW ${rentCollected.toLocaleString()}`,
        icon: DollarSign,
        description: `ZMW ${outstandingRent.toLocaleString()} outstanding`,
        href: '/reports',
        reportHref: '/reports?highlight=rental-income'
    },
    {
        title: 'Tenants with Arrears',
        value: tenantsInArrears,
        icon: AlertTriangle,
        description: 'Require follow-up',
        className: 'text-yellow-600 dark:text-yellow-400',
        iconClassName: 'bg-yellow-500/10',
        href: '/tenants?filter=Overdue,Pending',
        reportHref: '/reports?highlight=outstanding-rent'
    },
    {
        title: 'Lease Expirations (30d)',
        value: upcomingExpirations,
        icon: Clock,
        description: 'Leases ending soon',
        className: 'text-blue-600 dark:text-blue-400',
        iconClassName: 'bg-blue-500/10',
        href: '/tenants',
        reportHref: '/reports?highlight=lease-expiry'
    },
    ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cardData.map((card) => (
          <Card 
            key={card.title} 
            className="transition-all hover:shadow-lg hover:scale-[1.02] flex flex-col"
          >
            <Link href={card.href} className='flex-grow'>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn("p-3 rounded-lg bg-secondary", card.iconClassName)}>
                      <card.icon className={cn('h-6 w-6 text-muted-foreground', card.className)} />
                  </div>
                  <div className='flex-1'>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className={cn('text-2xl font-bold', card.className)}>
                        {card.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
            </Link>
            <div className='px-4 pb-2'>
                <Link href={card.reportHref} passHref>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className='w-full justify-start text-muted-foreground'
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        <span>View in Report</span>
                    </Button>
                </Link>
            </div>
          </Card>
      ))}
    </div>
  );
}
