'use client';

import { useState, useMemo } from 'react';
import type { UtilityBill } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Search, Trash2, Edit, ReceiptText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useUtility } from './utility-provider';
import { useToast } from '@/hooks/use-toast';
import { AddUtilityBill } from './add-utility-bill';
import { EditUtilityBill } from './edit-utility-bill';
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
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const statusStyles = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;

export function UtilityList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { utilityBills, isInitialized, deleteUtilityBill } = useUtility();
  const { toast } = useToast();

  const filteredBills = useMemo(() => {
    return utilityBills
      .filter(bill => {
        if (statusFilter === 'All') return true;
        return bill.status === statusFilter;
      })
      .filter(bill => 
        bill.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.utilityType.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [utilityBills, searchTerm, statusFilter]);

  const handleRemoveBill = (bill: UtilityBill) => {
    deleteUtilityBill(bill.id);
    toast({
        title: "Utility Bill Deleted",
        description: `The bill for ${bill.propertyName} has been removed.`,
    });
  };
  
  if (!isInitialized) {
    return <div>Loading utility bills...</div>;
  }

  if (!utilityBills.length) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <ReceiptText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold mt-4">No utility bills yet</h2>
            <p className="text-muted-foreground mt-2">Add your first utility bill to get started.</p>
            <AddUtilityBill>
              <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bill
              </Button>
            </AddUtilityBill>
        </div>
    )
  }

  return (
    <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                <div>
                    <CardTitle>Utility Bills</CardTitle>
                    <CardDescription>A list of all your property utility bills.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by property or type..."
                            className="pl-8 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className='w-full sm:w-[140px]'>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                    <AddUtilityBill />
                </div>
            </div>
        </CardHeader>
      <CardContent>
        {filteredBills.length > 0 ? (
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="hidden md:table-cell">Utility Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Billing Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.propertyName}</TableCell>
                          <TableCell className="hidden md:table-cell">{bill.utilityType}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {format(new Date(bill.billingPeriodStart), 'PP')} - {format(new Date(bill.billingPeriodEnd), 'PP')}
                          </TableCell>
                          <TableCell>ZMW {bill.amount.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(bill.dueDate), 'PP')}</TableCell>
                          <TableCell>
                            <Badge variant={statusStyles[bill.status]} className="text-xs">{bill.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <AlertDialog>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <EditUtilityBill bill={bill}>
                                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                    </EditUtilityBill>
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
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this utility bill record.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveBill(bill)} className="bg-destructive hover:bg-destructive/90">
                                            Yes, delete bill
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
            <div className="text-center py-16 border-2 border-dashed rounded-lg col-span-full">
                <h2 className="text-xl font-semibold">No matching bills</h2>
                <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
