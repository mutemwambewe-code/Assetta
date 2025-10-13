'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddTenant } from '@/components/tenants/add-tenant';
import { AddProperty } from '@/components/properties/add-property';
import { Plus, Building, UserPlus } from 'lucide-react';

export function AddEntityButton() {
  const [tenantOpen, setTenantOpen] = useState(false);
  const [propertyOpen, setPropertyOpen] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2" />
          Add New...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
         <AddTenant asChild>
            <DropdownMenuItem>
              <UserPlus className="mr-2" /> Add Tenant
            </DropdownMenuItem>
        </AddTenant>
        <AddProperty>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Building className="mr-2" /> Add Property
            </DropdownMenuItem>
        </AddProperty>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
