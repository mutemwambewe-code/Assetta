'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AddTenant } from '@/components/tenants/add-tenant';
import { AddProperty } from '@/components/properties/add-property';
import { Plus, Building, UserPlus } from 'lucide-react';

export function AddEntityButton() {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add New...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <AddProperty>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <div className="flex items-start gap-3 py-2">
                    <Building className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <p className="font-semibold">Add Property</p>
                        <p className="text-xs text-muted-foreground">Create a new property like an apartment block or a house.</p>
                    </div>
                </div>
            </DropdownMenuItem>
        </AddProperty>
        <DropdownMenuSeparator />
         <AddTenant>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <div className="flex items-start gap-3 py-2">
                <UserPlus className="h-5 w-5 mt-1 text-primary" />
                <div>
                    <p className="font-semibold">Add Tenant</p>
                    <p className="text-xs text-muted-foreground">Add a new tenant to one of your existing properties.</p>
                </div>
              </div>
            </DropdownMenuItem>
        </AddTenant>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
