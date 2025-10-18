
'use client';

import { AddTenant } from '@/components/tenants/add-tenant';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { RentStatusChart } from '@/components/dashboard/rent-status-chart';
import TenantActivity from '@/components/dashboard/tenant-activity';
import { Button } from '@/components/ui/button';
import { MessageSquare, Receipt } from 'lucide-react';
import Link from 'next/link';
import { AddEntityButton } from '@/components/dashboard/add-entity-button';
import { useProperties } from '../properties/property-provider';
import { useTenants } from '../tenants/tenant-provider';

export default function DashboardPage({ title }: { title?: string }) {
  const { isInitialized: propertiesReady } = useProperties();
  const { isInitialized: tenantsReady } = useTenants();
  const isReady = propertiesReady && tenantsReady;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Here&apos;s a summary of your properties.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <AddEntityButton disabled={!isReady} />
            <Link href="/communication" passHref>
                <Button variant="outline" disabled={!isReady}>
                    <MessageSquare className="mr-2" /> Send Message
                </Button>
            </Link>
            <Link href="/tenants" passHref>
                <Button disabled={!isReady}>
                    <Receipt className="mr-2" /> Record Payment
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
