'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenants } from '@/components/tenants/tenant-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { ArrowLeft, Edit, Mail, MessageSquare, Phone, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { LogPayment } from '@/components/tenants/log-payment';
import { EditTenant } from '@/components/tenants/edit-tenant';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

const statusStyles = {
  Paid: 'bg-accent text-accent-foreground border-transparent',
  Pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 dark:text-yellow-400',
  Overdue: 'bg-destructive/20 text-destructive border-destructive/30',
};

function TenantDetailPage({ title }: { title?: string }) {
  const params = useParams();
  const { tenants, deleteTenant } = useTenants();
  const { toast } = useToast();
  const router = useRouter();
  
  const tenantId = params.tenantId as string;
  const tenant = tenants.find((t) => t.id === tenantId);

  if (!tenant) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Tenant not found</h3>
            <p className="text-sm text-muted-foreground">
                The tenant you are looking for does not exist.
            </p>
            <Link href="/tenants">
                <Button variant="outline" className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Tenants
                </Button>
            </Link>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteTenant(tenant.id);
    toast({
        title: "Tenant Deleted",
        description: `${tenant.name} has been removed from your records.`,
    });
    router.push('/tenants');
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
       <div className='flex justify-start items-start gap-4 flex-col sm:flex-row sm:items-center'>
            <div className='flex-1'>
                <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                <p className="text-muted-foreground">
                    Tenant details, payment history, and communications.
                </p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-2">
                  <AvatarImage src={tenant.avatarUrl} alt={tenant.name} />
                <AvatarFallback className="text-3xl">
                  {tenant.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{tenant.name}</CardTitle>
              <CardDescription>
                {tenant.property} - Unit {tenant.unit}
              </CardDescription>
               <Badge className={cn('text-sm mt-2', statusStyles[tenant.rentStatus])}>
                {tenant.rentStatus}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div className="border-t pt-4 space-y-2">
                     <div className='flex justify-between items-center text-sm'>
                        <span className='text-muted-foreground'>Rent Amount:</span>
                        <span className='font-semibold'>ZMW {tenant.rentAmount.toLocaleString()}</span>
                     </div>
                      {tenant.nextDueDate && (
                       <div className='flex justify-between items-center text-sm'>
                          <span className='text-muted-foreground'>Next Due Date:</span>
                          <span className='font-semibold'>{format(new Date(tenant.nextDueDate), 'PPP')}</span>
                       </div>
                      )}
                     <div className='flex justify-between items-center text-sm'>
                        <span className='text-muted-foreground'>Lease End:</span>
                        <span className='font-semibold'>{format(new Date(tenant.leaseEndDate), 'PPP')}</span>
                     </div>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <LogPayment tenant={tenant}>
                    <Button variant="outline" className="w-full">
                        Log Payment
                    </Button>
                </LogPayment>
                <Link href={`/communication?tenantId=${tenant.id}`} className='w-full'>
                    <Button className="w-full">
                        <MessageSquare className="mr-2" />
                        Send Reminder
                    </Button>
                </Link>
                <EditTenant tenant={tenant}>
                    <Button variant='outline' className='w-full col-span-2'>
                        <Edit className='mr-2' /> Edit Tenant Details
                    </Button>
                </EditTenant>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full col-span-2">
                            <Trash2 className="mr-2" />
                            Delete Tenant
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {tenant.name} and all associated data from our servers.
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
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                A complete record of all payments made by {tenant.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenant.paymentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenant.paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.date), 'PPP')}</TableCell>
                        <TableCell>ZMW {payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No Payments Recorded</h2>
                    <p className="text-muted-foreground mt-2">Log a payment to see the history here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

TenantDetailPage.title = 'Tenant Details';
export default TenantDetailPage;
