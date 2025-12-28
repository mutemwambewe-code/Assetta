'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon, Loader2, Plus, Trash2, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useTenants } from './tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tenant, InvoiceItem } from '@/lib/types';
import { sendInvoiceEmail } from '@/app/actions/send-invoice-email';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
});

const formSchema = z.object({
  dueDate: z.date({ required_error: 'Due date is required.' }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function SendInvoice({ tenant, children }: { tenant: Tenant; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { addInvoice } = useTenants();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dueDate: addDays(new Date(), 14),
      items: [{ description: `Monthly Rent for ${tenant.unit} at ${tenant.property}`, amount: tenant.rentAmount }],
      notes: 'Please pay the amount due by the specified date. Payments can be made via Mobile Money or Bank Transfer.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const totalAmount = form.watch('items').reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
        form.reset({
            dueDate: addDays(new Date(), 14),
            items: [{ description: `Monthly Rent for ${tenant.unit} at ${tenant.property}`, amount: tenant.rentAmount }],
            notes: 'Please pay the amount due by the specified date. Payments can be made via Mobile Money or Bank Transfer.',
        })
    }
    setOpen(isOpen);
  }

  async function onSubmit(values: FormData) {
    if (!tenant.email) {
        toast({
            variant: "destructive",
            title: "Cannot Send Invoice",
            description: "This tenant does not have an email address on file.",
        });
        return;
    }
    setIsSending(true);

    const invoiceData = {
        tenantId: tenant.id,
        propertyId: tenant.propertyId || '',
        issueDate: new Date().toISOString(),
        dueDate: values.dueDate.toISOString(),
        items: values.items,
        notes: values.notes,
        totalAmount,
        status: 'sent' as const,
        tenantName: tenant.name,
        propertyName: tenant.property,
    };

    const newInvoice = await addInvoice(invoiceData);
    
    if (newInvoice) {
        const result = await sendInvoiceEmail(newInvoice, tenant.email);
        if (result.success) {
            toast({
                title: 'Invoice Sent!',
                description: `An invoice has been sent to ${tenant.name}.`,
            });
            setOpen(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Email Failed to Send',
                description: result.message,
            });
        }
    } else {
         toast({
            variant: 'destructive',
            title: 'Failed to Save Invoice',
            description: 'Could not save the invoice to the database.',
        });
    }


    setIsSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Invoice to {tenant.name}</DialogTitle>
          <DialogDescription>
            Customize the invoice items and send it to {tenant.email}.
          </DialogDescription>
        </DialogHeader>
        {!tenant.email && (
            <Alert variant="destructive">
                <AlertTitle>No Email Address</AlertTitle>
                <AlertDescription>This tenant does not have an email address on file. You cannot send an invoice.</AlertDescription>
            </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(index !== 0 && "sr-only")}>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-32" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', amount: 0 })}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <div className="text-right self-end">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">ZMW {totalAmount.toLocaleString()}</p>
                </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSending || !tenant.email}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
