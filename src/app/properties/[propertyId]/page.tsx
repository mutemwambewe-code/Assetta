
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTenants } from '@/components/tenants/tenant-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { ArrowLeft, Building, MapPin, Users, Tag, Edit, Trash2, ReceiptText, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AddTenant } from '@/components/tenants/add-tenant';
import { useProperties } from '@/components/properties/property-provider';
import { EditProperty } from '@/components/properties/edit-property';
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
import { useUtility } from '@/components/utilities/utility-provider';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { EditUtilityBill } from '@/components/utilities/edit-utility-bill';

const rentStatusStyles = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;

const utilityStatusStyles = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;


function PropertyDetailPage({ title }: { title?: string }) {
  const params = useParams();
  const router = useRouter();
  const { tenants } = useTenants();
  const { properties, deleteProperty } = useProperties();
  const { utilityBills, deleteUtilityBill } = useUtility();
  const { toast } = useToast();
  
  const propertyId = params.propertyId as string;
  const property = properties.find((p) => p.id === propertyId);

  if (!property) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Property not found</h3>
            <p className="text-sm text-muted-foreground">
                The property you are looking for does not exist.
            </p>
            <Link href="/properties">
                <Button variant="outline" className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Properties
                </Button>
            </Link>
        </div>
      </div>
    );
  }

  const tenantsInProperty = tenants.filter(t => t.property === property.name);
  const occupancyRate = property.units > 0 ? (tenantsInProperty.length / property.units) * 100 : 0;
  const billsForProperty = utilityBills.filter(b => b.propertyId === property.id).slice(0, 5); // show recent 5

  const handleRowClick = (tenantId: string) => {
    router.push(`/tenants/${tenantId}`);
  };

  const handleDelete = () => {
    deleteProperty(property.id);
    toast({
        title: "Property Deleted",
        description: `${property.name} has been removed from your records.`,
    });
    router.push('/properties');
  }

   const handleRemoveBill = (billId: string) => {
    deleteUtilityBill(billId);
    toast({
      title: "Utility Bill Deleted",
      description: "The bill has been removed from your records.",
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
       <div className='flex justify-between items-start flex-col sm:flex-row sm:items-center gap-4'>
            <div className='flex-1'>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Building />
                    {property.name}
                </h1>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-muted-foreground mt-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {property.location}
                    </div>
                     <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {property.type}
                    </div>
                </div>
            </div>
            <div className='flex items-center gap-2 self-start sm:self-center'>
                <Link href="/properties">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                </Link>
                <EditProperty property={property}>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>
                </EditProperty>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                             <span className="hidden sm:inline">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {property.name} and all associated data from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete property
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Property Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Occupancy</p>
                        <p className="text-xl font-bold">{tenantsInProperty.length} / {property.units}</p>
                    </div>
                </div>
                 <div className="flex flex-col justify-center gap-2 p-4 border rounded-lg md:col-span-2">
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-muted-foreground'>Occupancy Rate</span>
                        <span className='text-sm font-bold'>{occupancyRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={occupancyRate} className="h-3" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Tenants</CardTitle>
                  <CardDescription>
                    A list of all tenants in {property.name}.
                  </CardDescription>
                </div>
                <AddTenant />
              </div>
            </CardHeader>
            <CardContent>
              {tenantsInProperty.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead className="hidden sm:table-cell">Unit</TableHead>
                          <TableHead>Rent Status</TableHead>
                          <TableHead className="hidden md:table-cell">Contact</TableHead>
                          <TableHead className='text-right'>Rent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenantsInProperty.map((tenant) => (
                          <TableRow key={tenant.id} onClick={() => handleRowClick(tenant.id)} className="cursor-pointer">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage asChild src={tenant.avatarUrl}>
                                        <Image src={tenant.avatarUrl} alt={tenant.name} width={40} height={40} />
                                    </AvatarImage>
                                    <AvatarFallback>{tenant.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{tenant.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{tenant.unit}</TableCell>
                            <TableCell>
                                <Badge variant={rentStatusStyles[tenant.rentStatus]} className="text-xs">
                                    {tenant.rentStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{tenant.phone}</TableCell>
                            <TableCell className='text-right'>ZMW {tenant.rentAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No Tenants in this Property</h2>
                    <p className="text-muted-foreground mt-2">Add a tenant to see them listed here.</p>
                </div>
              )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Utility Bills</CardTitle>
                  <CardDescription>
                    Recent utility bills for {property.name}.
                  </CardDescription>
                </div>
                <Link href="/utilities">
                  <Button variant="outline">Manage Utilities</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {billsForProperty.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                           <TableHead className='text-right'></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billsForProperty.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell className="font-medium">{bill.utilityType}</TableCell>
                            <TableCell>{format(new Date(bill.billingPeriodEnd), 'MMM yyyy')}</TableCell>
                            <TableCell>ZMW {bill.amount.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant={utilityStatusStyles[bill.status]} className="text-xs">
                                    {bill.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <EditUtilityBill bill={bill}><DropdownMenuItem onSelect={e => e.preventDefault()}>Edit</DropdownMenuItem></EditUtilityBill>
                                            <DropdownMenuSeparator/>
                                            <AlertDialogTrigger asChild><DropdownMenuItem className='text-destructive' onSelect={e => e.preventDefault()}>Delete</DropdownMenuItem></AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete this utility bill record.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveBill(bill.id)} className="bg-destructive hover:bg-destructive/90">
                                            Yes, delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <ReceiptText className='h-10 w-10 mx-auto text-muted-foreground' />
                    <h2 className="text-xl font-semibold mt-2">No Utility Bills</h2>
                    <p className="text-muted-foreground mt-2">No utility bills have been recorded for this property yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  );
}

PropertyDetailPage.title = "Property Details";
export default PropertyDetailPage;
