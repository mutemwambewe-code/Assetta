
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
import { CalendarIcon, Loader2, Plus, Trash2, Send, AlertTriangle, Users, ChevronsUpDown, Check, X, ChevronDown } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useProperties } from '../properties/property-provider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';


const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
});

const formSchema = z.object({
  recipientType: z.enum(['individual', 'group']).default('individual'),
  tenantId: z.string().optional(),
  groupId: z.string().optional(),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function InvoiceComposer() {
  const { tenants, addInvoice, isInitialized } = useTenants();
  const { properties } = useProperties();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const searchParams = useSearchParams();
  const tenantIdFromParams = searchParams.get('tenantId');
  const [editableRecipients, setEditableRecipients] = useState<Tenant[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientType: tenantIdFromParams ? 'individual' : 'group',
      tenantId: tenantIdFromParams || '',
      groupId: '',
      dueDate: addDays(new Date(), 14),
      items: [{ description: 'Monthly Rent', amount: 0 }],
      notes: 'Please pay the amount due by the specified date. Payments can be made via Mobile Money or Bank Transfer.',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const { control, handleSubmit, watch, setValue } = form;
  const watchedValues = useWatch({ control: form.control });

  const recipientType = watch('recipientType');
  const selectedTenantId = watch('tenantId');
  const groupId = watch('groupId');
  
  const selectedTenant = useMemo(() => tenants.find(t => t.id === selectedTenantId), [tenants, selectedTenantId]);
  
  const getRecipientsForGroup = (selectedGroupId: string | undefined): Tenant[] => {
    if (!selectedGroupId) return [];
    if (selectedGroupId === 'all') return tenants.filter(t => t.email);
    if (selectedGroupId === 'arrears') return tenants.filter(t => t.rentStatus === 'Overdue' && t.email);
    if (selectedGroupId === 'pending') return tenants.filter(t => t.rentStatus === 'Pending' && t.email);
    if (selectedGroupId.startsWith('prop-')) {
      const propId = selectedGroupId.replace('prop-', '');
      const prop = properties.find(p => p.id === propId);
      if (prop) return tenants.filter(t => t.property === prop.name && t.email);
    }
    return [];
  };

  const handleGroupSelection = (value: string) => {
    const newRecipients = getRecipientsForGroup(value);
    setValue('groupId', value);
    setEditableRecipients(newRecipients);
    setPopoverOpen(false);
  };
  
  const handleRemoveRecipient = (tenantId: string) => {
    setEditableRecipients(prev => prev.filter(t => t.id !== tenantId));
  }
  
  const bulkGroups = [
    { id: 'all', name: 'All Tenants (with email)' },
    { id: 'arrears', name: 'Tenants in Arrears (with email)' },
    { id: 'pending', name: 'Tenants with Pending Payments (with email)' },
    ...properties.map(p => ({id: `prop-${p.id}`, name: `All Tenants in ${p.name} (with email)`})),
  ];

  const previewTenant = useMemo(() => {
    if (recipientType === 'individual') return selectedTenant;
    if (editableRecipients.length > 0) return editableRecipients[0];
    if (tenants.length > 0) return tenants.find(t => t.email); // find first tenant with email
    return undefined;
  }, [recipientType, selectedTenant, editableRecipients, tenants]);


  useEffect(() => {
    if (tenantIdFromParams) {
        form.setValue('tenantId', tenantIdFromParams);
        form.setValue('recipientType', 'individual');
    }
  }, [tenantIdFromParams, form]);
  
  useEffect(() => {
    if (recipientType === 'individual' && selectedTenant) {
      form.setValue('items', [{ description: `Monthly Rent for ${selectedTenant.unit} at ${selectedTenant.property}`, amount: selectedTenant.rentAmount }]);
    } else {
      // For groups, reset to a generic item. The amount will be personalized on send.
      form.setValue('items', [{ description: `Monthly Rent`, amount: 0 }]);
    }
  }, [selectedTenant, recipientType, form]);
  
  const totalAmount = watchedValues.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  
  const isSendDisabled = isSending || !isInitialized || (recipientType === 'individual' && !selectedTenantId) || (recipientType === 'group' && editableRecipients.length === 0);

  async function onSubmit(values: FormData) {
    setIsSending(true);

    let recipients: Tenant[] = [];
    if (recipientType === 'individual' && selectedTenant) {
      recipients.push(selectedTenant);
    } else if (recipientType === 'group') {
      recipients = editableRecipients;
    }

    if (recipients.length === 0) {
      toast({
        variant: "destructive",
        title: "No Recipients",
        description: "Please select at least one tenant with an email address.",
      });
      setIsSending(false);
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    let firstErrorMessage = '';

    for (const tenant of recipients) {
        // For groups, dynamically generate the invoice items for each tenant
        const itemsForTenant = recipientType === 'group'
            ? [{ description: `Monthly Rent for ${tenant.unit} at ${tenant.property}`, amount: tenant.rentAmount }]
            : values.items;

        const totalForTenant = itemsForTenant.reduce((sum, item) => sum + item.amount, 0);

        const invoiceData = {
            tenantId: tenant.id,
            propertyId: tenant.propertyId || '',
            issueDate: new Date().toISOString(),
            dueDate: values.dueDate.toISOString(),
            items: itemsForTenant,
            notes: values.notes,
            totalAmount: totalForTenant,
            status: 'sent' as const,
            tenantName: tenant.name,
            propertyName: tenant.property,
        };

        const newInvoice = await addInvoice(invoiceData);
        
        if (newInvoice && tenant.email) {
            const result = await sendInvoiceEmail(newInvoice, tenant.email);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
                if(!firstErrorMessage) firstErrorMessage = result.message;
            }
        } else {
            failCount++;
            if(!firstErrorMessage) firstErrorMessage = 'Failed to save invoice or tenant email is missing.';
        }
    }


    if (failCount > 0) {
        toast({
            variant: 'destructive',
            title: 'Some Invoices Failed to Send',
            description: `${successCount} sent, ${failCount} failed. First error: ${firstErrorMessage}`,
        });
    } else {
        toast({
            title: 'Invoices Sent!',
            description: `Successfully sent invoices to ${successCount} tenant(s).`,
        });
    }

    form.reset({
      recipientType: 'group',
      tenantId: '',
      groupId: '',
      dueDate: addDays(new Date(), 14),
      items: [{ description: 'Monthly Rent', amount: 0 }],
      notes: 'Please pay the amount due by the specified date. Payments can be made via Mobile Money or Bank Transfer.',
    });
    setEditableRecipients([]);
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
              
              <Controller
                name="recipientType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={(value) => {
                        field.onChange(value);
                        setValue('tenantId', '');
                        setValue('groupId', '');
                        setEditableRecipients([]);
                    }}
                    defaultValue={field.value}
                    className="flex items-center space-x-4"
                    value={field.value}
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="individual" id="individual" /></FormControl>
                      <Label htmlFor="individual">Individual Tenant</Label>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="group" id="group" /></FormControl>
                      <Label htmlFor="group">Bulk Group</Label>
                    </FormItem>
                  </RadioGroup>
                )}
              />

              {recipientType === 'individual' ? (
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
              ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="groupId">Select Group</Label>
                         <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                              {groupId ? bulkGroups.find((group) => group.id === groupId)?.name : "Select a bulk group"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder="Search groups..." />
                              <CommandList>
                                <CommandEmpty>No group found.</CommandEmpty>
                                <CommandGroup>
                                  {bulkGroups.map((group) => (
                                    <CommandItem key={group.id} value={group.id} onSelect={() => handleGroupSelection(group.id)}>
                                      <Check className={cn("mr-2 h-4 w-4", groupId === group.id ? "opacity-100" : "opacity-0")} />
                                      {group.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                    </div>
                    {editableRecipients.length > 0 && (
                        <Collapsible className='-mx-4' defaultOpen>
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-muted/50 px-4 py-2 text-sm font-medium hover:bg-muted">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>{editableRecipients.length} Recipient{editableRecipients.length > 1 ? 's' : ''} Selected</span>
                                </div>
                                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <ScrollArea className="h-48 rounded-md border mt-2">
                                <div className="p-2 space-y-1">
                                    {editableRecipients.map(tenant => (
                                    <div key={tenant.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                        <Avatar className="h-8 w-8">
                                            {tenant.avatarUrl && <AvatarImage asChild src={tenant.avatarUrl}><Image src={tenant.avatarUrl} alt={tenant.name} width={32} height={32} /></AvatarImage>}
                                            <AvatarFallback>{tenant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{tenant.name}</p>
                                            <p className="text-xs text-muted-foreground">{tenant.email}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleRemoveRecipient(tenant.id)}>
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove {tenant.name}</span>
                                        </Button>
                                    </div>
                                    ))}
                                </div>
                                </ScrollArea>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
              )}

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
                          <FormControl><Input type="number" {...field} className="w-32" placeholder="0.00" disabled={recipientType === 'group'} /></FormControl>
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
                {recipientType === 'group' && <p className='text-xs text-muted-foreground'>For bulk invoices, rent amount is automatically set for each tenant. Add other fixed charges here.</p>}
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
                <Button type="submit" disabled={isSendDisabled}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Invoice(s)
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
                    tenant={previewTenant}
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
