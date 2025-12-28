
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { CalendarIcon, Loader2, Plus, Trash2, Send, AlertTriangle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useTenants } from '../tenants/tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tenant } from '@/lib/types';
import { sendInvoiceEmail } from '@/app/actions/send-invoice-email';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InvoicePreview } from './invoice-preview';
import { useSearchParams } from 'next/navigation';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
});

const formSchema = z.object({
  tenantId: z.string().min(1, 'Please select a tenant.'),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function InvoiceComposer() {
  const { tenants, addInvoice, isInitialized } = useTenants();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const searchParams = useSearchParams();
  const tenantIdFromParams = searchParams.get('tenantId');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: tenantIdFromParams || '',
      dueDate: addDays(new Date(), 14),
      items: [{ description: 'Monthly Rent', amount: 0 }],
      notes: 'Please pay the amount due by the specified date. Payments can be made via Mobile Money or Bank Transfer.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedValues = useWatch({ control: form.control });
  const selectedTenantId = form.watch('tenantId');
  const selectedTenant = useMemo(() => tenants.find(t => t.id === selectedTenantId), [tenants, selectedTenantId]);
  
  useEffect(() => {
    if (tenantIdFromParams) {
        form.setValue('tenantId', tenantIdFromParams);
    }
  }, [tenantIdFromParams, form]);
  
  useEffect(() => {
    if (selectedTenant) {
      form.setValue('items', [{ description: `Monthly Rent for ${selectedTenant.unit} at ${selectedTenant.property}`, amount: selectedTenant.rentAmount }]);
    }
  }, [selectedTenant, form]);
  
  const totalAmount = watchedValues.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  async function onSubmit(values: FormData) {
    if (!selectedTenant?.email) {
        toast({
            variant: "destructive",
            title: "Cannot Send Invoice",
            description: "This tenant does not have an email address on file.",
        });
        return;
    }
    setIsSending(true);

    const invoiceData = {
        tenantId: selectedTenant.id,
        propertyId: selectedTenant.propertyId || '',
        issueDate: new Date().toISOString(),
        dueDate: values.dueDate.toISOString(),
        items: values.items,
        notes: values.notes,
        totalAmount,
        status: 'sent' as const,
        tenantName: selectedTenant.name,
        propertyName: selectedTenant.property,
    };

    const newInvoice = await addInvoice(invoiceData);
    
    if (newInvoice) {
        const result = await sendInvoiceEmail(newInvoice, selectedTenant.email);
        if (result.success) {
            toast({
                title: 'Invoice Sent!',
                description: `An invoice has been sent to ${selectedTenant.name}.`,
            });
            form.reset({
                tenantId: '',
                dueDate: addDays(new Date(), 14),
                items: [{ description: 'Monthly Rent', amount: 0 }],
                notes: 'Please pay the amount due by the specified date. Payments can be made via Mobile Money or Bank Transfer.',
            });
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Fill in the details to create a new invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Tenant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tenant to invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.filter(t => t.email).map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.property})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTenantId && !selectedTenant?.email && (
                      <p className="text-sm text-yellow-600 flex items-center gap-2 pt-2">
                        <AlertTriangle className='h-4 w-4' /> This tenant has no email. Invoices cannot be sent.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-md border p-4">
                <p className="text-sm font-medium">Invoice Items</p>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. Monthly Rent" /></FormControl>
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
                          <FormControl><Input type="number" {...field} className="w-32" placeholder="0.00" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
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
                                <Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
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
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea {...field} rows={4} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end border-t pt-6">
                <Button type="submit" disabled={isSending || !selectedTenant?.email || !isInitialized}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Invoice
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div>
        <div className="sticky top-24">
            <CardHeader>
                <CardTitle>Invoice Preview</CardTitle>
                <CardDescription>This is what your tenant will see in their email.</CardDescription>
            </CardHeader>
            <CardContent>
                <InvoicePreview 
                    tenant={selectedTenant}
                    items={watchedValues.items || []}
                    totalAmount={totalAmount}
                    dueDate={watchedValues.dueDate}
                    notes={watchedValues.notes}
                />
            </CardContent>
        </div>
      </div>
    </div>
  );
}
