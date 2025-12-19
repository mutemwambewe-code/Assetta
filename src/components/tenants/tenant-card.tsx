
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Tenant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Phone, Mail, MoreVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { EditTenant } from './edit-tenant';
import { LogPayment } from './log-payment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTenants } from './tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface TenantCardProps {
  tenant: Tenant;
}

const statusStyles = {
  Paid: 'bg-accent text-accent-foreground border-transparent',
  Pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400',
  Overdue: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function TenantCard({ tenant }: TenantCardProps) {
  const { deleteTenant } = useTenants();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTenant(tenant.id);
    toast({
        title: "Tenant Deleted",
        description: `${tenant.name} has been removed from your records.`,
    });
    // No need to redirect if we are on the list page already
  }

  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
       <Link href={`/tenants/${tenant.id}`} className="flex flex-col flex-grow">
        <CardHeader className="flex flex-row items-start gap-4">
            <Avatar className="h-14 w-14">
                {tenant.avatarUrl && (
                    <AvatarImage asChild src={tenant.avatarUrl}>
                        <Image src={tenant.avatarUrl} alt={tenant.name} width={56} height={56} />
                    </AvatarImage>
                )}
            <AvatarFallback className="text-xl">
                {tenant.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
            <h3 className="text-lg font-bold">{tenant.name}</h3>
            <p className="text-sm text-muted-foreground">
                {tenant.property} - Unit {tenant.unit}
            </p>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{tenant.phone}</span>
            </div>
            {tenant.email && (
              <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.email}</span>
              </div>
            )}
            <div className='flex items-center justify-between pt-2'>
                <div className='text-sm'>
                    <p className="text-muted-foreground">Rent</p>
                    <p className="font-semibold">ZMW {tenant.rentAmount.toLocaleString()}</p>
                </div>
                <Badge className={cn('text-xs', statusStyles[tenant.rentStatus])}>
                    {tenant.rentStatus}
                </Badge>
            </div>
        </CardContent>
      </Link>
      <CardFooter className="flex gap-2">
        <LogPayment tenant={tenant}>
            <Button variant="outline" className="w-full">
                Log Payment
            </Button>
        </LogPayment>
        <AlertDialog>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className='h-10 w-10' aria-label={`More options for ${tenant.name}`}>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                 <DropdownMenuItem asChild>
                    <Link href={`/communication?tenantId=${tenant.id}`}>
                        Send Reminder
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <EditTenant tenant={tenant}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                </EditTenant>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </AlertDialogTrigger>
            </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {tenant.name} and all associated data.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Yes, delete tenant
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
