
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenants } from './tenant-provider';
import { useToast } from '@/hooks/use-toast';
import type { Tenant, Payment } from '@/lib/types';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, Loader2 } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number().min(1, 'Payment amount must be positive.'),
  date: z.string().min(1, 'Payment date is required.'),
  method: z.enum(['Mobile Money', 'Bank Transfer', 'Cash']),
});

type FormData = z.infer<typeof formSchema>;

interface LogPaymentProps {
  tenant: Tenant;
  children: React.ReactNode;
}

export function LogPayment({ tenant, children }: LogPaymentProps) {
  const [open, setOpen] = useState(false);
  const { logPayment, isInitialized } = useTenants();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: tenant.rentAmount,
      date: format(new Date(), 'yyyy-MM-dd'),
      method: 'Mobile Money',
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
        form.reset({
            amount: tenant.rentAmount,
            date: format(new Date(), 'yyyy-MM-dd'),
            method: 'Mobile Money',
        });
    }
    setOpen(isOpen);
  }

  function onSubmit(values: FormData) {
    logPayment(tenant.id, values);
    toast({
      title: 'Payment Logged!',
      description: `Payment of ZMW ${values.amount.toLocaleString()} for ${tenant.name} has been recorded.`,
    });
    setOpen(false);
  }

  const isAlreadyPaid = tenant.rentStatus === 'Paid';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Payment for {tenant.name}</DialogTitle>
          <DialogDescription>
            Record a new rent payment for this tenant. Rent amount: ZMW {tenant.rentAmount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        {isAlreadyPaid && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Already Paid</AlertTitle>
            <AlertDescription>
              This tenant has already paid their rent for the current month. Logging another payment is not recommended unless it's for a different purpose.
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (ZMW)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={!isInitialized}>
                {!isInitialized && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
