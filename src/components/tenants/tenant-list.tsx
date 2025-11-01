
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { TenantCard } from './tenant-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Check as CheckIcon, Plus } from 'lucide-react';
import { useTenants } from './tenant-provider';
import { AddTenant } from './add-tenant';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

type FilterStatus = 'Paid' | 'Pending' | 'Overdue';
const ALL_STATUSES: FilterStatus[] = ['Paid', 'Pending', 'Overdue'];

function TenantListSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <Skeleton className="h-10 w-full sm:w-64" />
                <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

function CardSkeleton() {
    return (
      <div className="p-4 border rounded-lg space-y-3">
        <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className='flex-1 space-y-2'>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
        </div>
        <div className='flex items-center justify-between pt-2'>
            <div className='space-y-2'>
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-10" />
        </div>
      </div>
    );
  }

export function TenantList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { tenants, isInitialized } = useTenants();
  
  const getFiltersFromURL = (): FilterStatus[] => {
    const filterParam = searchParams.get('filter');
    if (!filterParam) return [];
    const filters = filterParam.split(',') as FilterStatus[];
    return filters.filter(f => ALL_STATUSES.includes(f));
  };
  
  const [activeFilters, setActiveFilters] = useState<FilterStatus[]>(getFiltersFromURL());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setActiveFilters(getFiltersFromURL());
  }, [searchParams]);

  const handleFilterToggle = (status: FilterStatus) => {
    const newFilters = activeFilters.includes(status)
      ? activeFilters.filter(f => f !== status)
      : [...activeFilters, status];
      
    setActiveFilters(newFilters);

    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.length > 0) {
      params.set('filter', newFilters.join(','));
    } else {
      params.delete('filter');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredTenants = tenants
    .filter((tenant) => {
      if (activeFilters.length === 0) return true;
      return activeFilters.includes(tenant.rentStatus);
    })
    .filter((tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (!isInitialized) {
      return <TenantListSkeleton />;
  }

  if (!tenants.length) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No tenants yet</h2>
            <p className="text-muted-foreground mt-2">Add your first tenant to get started.</p>
            <AddTenant>
              <Button className='mt-4'>
                <Plus className="mr-2 h-4 w-4" /> Add Tenant
              </Button>
            </AddTenant>
        </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tenants..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(ALL_STATUSES).map(
            (status) => {
              const isSelected = activeFilters.includes(status);
              return (
              <div key={status} className="flex items-center">
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleFilterToggle(status)}
                  className="capitalize h-10 pl-3 pr-4 rounded-md text-xs sm:text-sm"
                  aria-pressed={isSelected}
                >
                    <div className={cn(
                        "w-4 h-4 mr-2 border border-primary-foreground rounded-sm flex items-center justify-center",
                        isSelected ? "bg-primary-foreground" : "bg-transparent"
                    )}>
                       {isSelected && <CheckIcon className="h-3 w-3 text-primary" />}
                    </div>
                  {status}
                </Button>
              </div>
            )}
          )}
          <AddTenant>
             <Button className="h-10">
                <Plus className="mr-2 h-4 w-4" /> Add Tenant
             </Button>
          </AddTenant>
        </div>
      </div>

      {filteredTenants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg col-span-full">
            <h2 className="text-xl font-semibold">No matching tenants</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
