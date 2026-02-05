
'use client';

import { useState } from 'react';
import type { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Search, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { useTenants } from '../tenants/tenant-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProperties } from './property-provider';
import { useToast } from '@/hooks/use-toast';
import { AddProperty } from './add-property';
import { EditProperty } from './edit-property';
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

export function PropertyList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { tenants } = useTenants();
  const { properties, isInitialized, deleteProperty } = useProperties();
  const router = useRouter();
  const { toast } = useToast();

  const propertiesWithOccupancy = properties.map(p => {
    const occupiedCount = tenants.filter(t => t.property === p.name).length;
    return { ...p, occupied: occupiedCount };
  });

  const filteredProperties = propertiesWithOccupancy.filter((property) =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRemoveProperty = (property: Property) => {
    deleteProperty(property.id);
    toast({
        title: "Property Deleted",
        description: `${property.name} has been removed from your list.`,
    });
  };
  
  const handleRowClick = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  if (!isInitialized) {
    // You could add a skeleton loader here
    return <div>Loading properties...</div>;
  }

  if (!properties.length) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No properties yet</h2>
            <p className="text-muted-foreground mt-2">Add your first property to get started.</p>
            <AddProperty>
              <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
              </Button>
            </AddProperty>
        </div>
    )
  }

  return (
    <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                <div>
                    <CardTitle>Properties</CardTitle>
                    <CardDescription>A list of all your properties.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search properties..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <AddProperty />
                </div>
            </div>
        </CardHeader>
      <CardContent>
        {filteredProperties.length > 0 ? (
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[30%]'>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="hidden sm:table-cell">Units</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => {
                      const occupancyRate = property.units > 0 ? (property.occupied / property.units) * 100 : 0;
                      return (
                          <TableRow key={property.id} onClick={() => handleRowClick(property.id)} className="cursor-pointer">
                              <TableCell className="font-medium">{property.name}</TableCell>
                              <TableCell className="hidden md:table-cell">{property.type}</TableCell>
                              <TableCell className="hidden lg:table-cell">{property.location}</TableCell>
                              <TableCell className="hidden sm:table-cell">{property.units}</TableCell>
                              <TableCell>
                                  <div className='flex items-center gap-2'>
                                      <Progress value={occupancyRate} className="w-16 h-2" />
                                      <span className='text-muted-foreground text-xs'>{property.occupied}/{property.units}</span>
                                  </div>
                              </TableCell>
                              <TableCell className="text-right">
                                 <AlertDialog>
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">More options for {property.name}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/properties/${property.id}`}>View Details</Link>
                                        </DropdownMenuItem>
                                        <EditProperty property={property}>
                                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); }}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        </EditProperty>
                                        <DropdownMenuSeparator />
                                         <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                            className="text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete {property.name} and all associated data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveProperty(property)} className="bg-destructive hover:bg-destructive/90">
                                                Yes, delete property
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                          </TableRow>
                      )
                  })}
                </TableBody>
              </Table>
          </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg col-span-full">
                <h2 className="text-xl font-semibold">No matching properties</h2>
                <p className="text-muted-foreground mt-2">Try adjusting your search.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
