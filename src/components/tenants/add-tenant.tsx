
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTenants } from './tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useProperties } from '../properties/property-provider';
import { AddProperty } from '../properties/add-property';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Property } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { countries } from '@/lib/countries';
import { Combobox } from '../ui/combobox';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  countryCode: z.string().min(1, "Country code is required."),
  phone: z.string().min(1, 'Phone number is required.'),
  property: z.string().min(1, 'Please select a property.'),
  unit: z.string().min(1, 'Unit is required.'),
  rentAmount: z.coerce.number().min(1, 'Rent amount must be positive.'),
  leaseStartDate: z.date({
    required_error: 'Lease start date is required.',
  }),
  leaseEndDate: z.date({
    required_error: 'Lease end date is required.',
  }),
}).refine(data => {
    const selectedCountry = countries.find(c => c.dial_code === data.countryCode);
    if (!selectedCountry) return false;
    const phoneDigits = data.phone.replace(/\D/g, '');
    return phoneDigits.length === selectedCountry.phone_length;
}, (data) => {
    const selectedCountry = countries.find(c => c.dial_code === data.countryCode);
    return {
        message: `Phone numbers in ${selectedCountry?.name || 'the selected country'} must have ${selectedCountry?.phone_length || 'a specific number of'} digits.`,
        path: ['phone'],
    };
});


type FormData = z.infer<typeof formSchema>;


// Internal component for the mobile date picker dialog
const MobileDatePicker = ({
  value,
  onChange,
  trigger,
}: {
  value: Date;
  onChange: (date?: Date) => void;
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-auto">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          initialFocus
        />
      </DialogContent>
    </Dialog>
  );
};


export function AddTenant({ asChild, className }: { asChild?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const { tenants, addTenant, isInitialized: tenantsReady } = useTenants();
  const { properties, isInitialized: propertiesReady } = useProperties();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isProviderReady = tenantsReady && propertiesReady;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      countryCode: "+260",
      phone: '',
      property: '',
      unit: '',
      rentAmount: 0,
    },
  });

  const selectedPropertyName = form.watch('property');
  const selectedCountryCode = form.watch('countryCode');

  const selectedProperty = useMemo(() => {
    return properties.find(p => p.name === selectedPropertyName);
  }, [properties, selectedPropertyName]);
  
  const selectedCountry = useMemo(() => {
    return countries.find(c => c.dial_code === selectedCountryCode);
  }, [selectedCountryCode]);

  const isPropertyFull = useMemo(() => {
    if (!selectedProperty) return false;
    const tenantsInProperty = tenants.filter(t => t.property === selectedProperty.name).length;
    return tenantsInProperty >= selectedProperty.units;
  }, [tenants, selectedProperty]);

  function onSubmit(values: FormData) {
    if (isPropertyFull) {
        toast({
            variant: "destructive",
            title: "Property is Full",
            description: `Cannot add more tenants to ${selectedProperty?.name}.`,
        });
        return;
    }
    const phoneDigits = values.phone.replace(/\D/g, '');
    const tenantData = {
        ...values,
        phone: `${values.countryCode}${phoneDigits}`,
        leaseStartDate: format(values.leaseStartDate, 'yyyy-MM-dd'),
        leaseEndDate: format(values.leaseEndDate, 'yyyy-MM-dd'),
    }
    addTenant(tenantData);
    toast({
      title: 'Tenant Added!',
      description: `${values.name} has been added to your tenant list.`,
    });
    setOpen(false);
    form.reset();
  }
  
  const handlePropertyAdded = (newProperty: Property) => {
    form.setValue('property', newProperty.name);
  }

  const DatePicker = ({ field, disabled }: { field: any, disabled?: (date: Date) => boolean }) => {
    const triggerButton = (
      <Button
        variant={'outline'}
        className={cn('pl-3 text-left font-normal w-full', !field.value && 'text-muted-foreground')}
      >
        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </Button>
    );

    if (isMobile) {
      return <MobileDatePicker value={field.value} onChange={field.onChange} trigger={triggerButton} />;
    }

    return (
      <Popover>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={disabled} initialFocus />
        </PopoverContent>
      </Popover>
    );
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asChild ? (
            <span className={cn('cursor-pointer', className)}>
                <Plus className="mr-2" /> Add Tenant
            </span>
        ) : (
            <Button variant="outline" className={className}>
                <Plus className="mr-2" /> Add Tenant
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>Enter the details of the new tenant below.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem className="col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div className="col-span-2">
                  <FormLabel>Phone Number</FormLabel>
                  <div className="flex gap-2 mt-2">
                      <FormField
                          control={form.control}
                          name="countryCode"
                          render={({ field }) => (
                              <FormItem className="w-[150px]">
                                  <Combobox
                                      items={countries.map(c => ({ value: c.dial_code, label: `${c.flag} ${c.name} (${c.dial_code})`}))}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Code"
                                      searchPlaceholder="Search country..."
                                  />
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                              <FormItem className="flex-1">
                                  <FormControl>
                                      <Input 
                                        placeholder={selectedCountry?.phone_format || '977 123 456'} 
                                        {...field}
                                        onChange={(e) => {
                                            const digitsOnly = e.target.value.replace(/\D/g, '');
                                            if (selectedCountry && digitsOnly.length > selectedCountry.phone_length) {
                                                field.onChange(digitsOnly.slice(0, selectedCountry.phone_length));
                                            } else {
                                                field.onChange(e.target.value);
                                            }
                                        }}
                                      />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                </div>
            </div>

            {properties.length > 0 ? (
                <FormField
                control={form.control}
                name="property"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {properties.map(p => <SelectItem key={p.id} value={p.name}>{p.name} ({tenants.filter(t => t.property === p.name).length}/{p.units})</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            ) : (
                <Alert>
                    <AlertTitle>No Properties Found</AlertTitle>
                    <AlertDescription className='flex flex-col gap-2'>
                        You need to add a property before you can add a tenant.
                        <AddProperty onPropertyAdded={handlePropertyAdded}>
                            <Button size='sm'>
                                <Plus className='mr-2' />
                                Add a Property
                            </Button>
                        </AddProperty>
                    </AlertDescription>
                </Alert>
            )}

            {isPropertyFull && selectedProperty && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Property Full</AlertTitle>
                    <AlertDescription>
                        {selectedProperty.name} has reached its maximum capacity of {selectedProperty.units} tenants.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. A01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="rentAmount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rent Amount (ZMW)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="leaseStartDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Lease Start</FormLabel>
                            <FormControl>
                                <DatePicker field={field} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="leaseEndDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Lease End</FormLabel>
                           <FormControl>
                                <DatePicker field={field} />
                            </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <DialogFooter className="sticky bottom-0 bg-background py-4 -mx-6 px-6">
              <Button type="submit" disabled={!isProviderReady || properties.length === 0 || isPropertyFull}>
                {!isProviderReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Tenant
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
