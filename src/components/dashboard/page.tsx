'use client';

import { AddTenant } from '@/components/tenants/add-tenant';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { Button } from '@/components/ui/button';
import { MessageSquare, Receipt } from 'lucide-react';
import Link from 'next/link';
import { AddEntityButton } from '@/components/dashboard/add-entity-button';
import { useProperties } from '../properties/property-provider';
import { useTenants } from '../tenants/tenant-provider';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { RentStatusChart } from './rent-status-chart';
import { useUtility } from '../utilities/utility-provider';

const TenantActivity = dynamic(
  () => import('@/components/dashboard/tenant-activity'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px]" />,
  }
);


export default function DashboardPage({ title }: { title?: string }) {
  const { isInitialized: propertiesReady } = useProperties();
  const { isInitialized: tenantsReady } = useTenants();
  const { isInitialized: utilitiesReady } = useUtility();
  const isReady = propertiesReady && tenantsReady && utilitiesReady;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Here&apos;s a summary of your properties.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <AddEntityButton disabled={!isReady} />
            <Link href="/communication" passHref>
                <Button variant="outline" disabled={!isReady} className="flex-1 sm:flex-none">
                    <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                </Button>
            </Link>
            <Link href="/tenants" passHref>
                <Button disabled={!isReady} className="flex-1 sm:flex-none">
                    <Receipt className="mr-2 h-4 w-4" /> Record Payment
                </Button>
            </Link>
        </div>
      </div>
      
      <OverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RentStatusChart />
        </div>
        <div className="lg:col-span-2">
          <TenantActivity />
        </div>
      </div>
    </div>
  );
}

DashboardPage.title = 'Dashboard';
