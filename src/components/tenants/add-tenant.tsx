
'use client';

import { useState, useMemo } from 'react';
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
import { countries } from '@/lib/countries';

const phoneFormSchema = z.object({
  countryCode: z.string().min(1),
  number: z.string().min(1, 'Phone number is required.'),
});

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Phone number seems too short.'),
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
    // This is a workaround to validate the phone number length based on the country code.
    // In a real app, you would likely use a more robust library like libphonenumber-js.
    const phoneWithCode = data.phone;
    if (!phoneWithCode.startsWith('+')) return false;

    const country = countries.find(c => phoneWithCode.startsWith(`+${c.phone}`));
    if (!country) return true; // Cannot validate if country not in our list
    
    const numberPart = phoneWithCode.replace(`+${country.phone}`, '');
    return numberPart.length === country.phoneLength;
}, {
    message: 'Phone number has an incorrect number of digits for the selected country.',
    path: ['phone'],
});


type FormData = z.infer<typeof formSchema>;

export function AddTenant({ asChild, className }: { asChild?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const { tenants, addTenant, isInitialized: tenantsReady } = useTenants();
  const { properties, isInitialized: propertiesReady } = useProperties();
  const { toast } = useToast();

  const isProviderReady = tenantsReady && propertiesReady;
  
  const [phoneCountryCode, setPhoneCountryCode] = useState(countries[0].phone);
  const [phoneNumber, setPhoneNumber] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      property: '',
      unit: '',
      rentAmount: 0,
    },
  });
  
  const selectedCountryForPhone = countries.find(c => c.phone === phoneCountryCode);

  const selectedPropertyName = form.watch('property');

  const selectedProperty = useMemo(() => {
    return properties.find(p => p.name === selectedPropertyName);
  }, [properties, selectedPropertyName]);

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

    const tenantData = {
        ...values,
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
    setPhoneNumber('');
    setPhoneCountryCode(countries[0].phone);
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    const selectedCountry = countries.find(c => c.phone === phoneCountryCode);
    
    if (selectedCountry) {
        const maxLength = selectedCountry.phoneLength;
        setPhoneNumber(value.slice(0, maxLength));
        form.setValue('phone', `+${phoneCountryCode}${value.slice(0, maxLength)}`);
    } else {
        setPhoneNumber(value);
        form.setValue('phone', `+${phoneCountryCode}${value}`);
    }
  }
  
  const handleCountryChange = (value: string) => {
    setPhoneCountryCode(value);
    form.setValue('phone', `+${value}${phoneNumber}`);
  }


  const handlePropertyAdded = (newProperty: Property) => {
    form.setValue('property', newProperty.name);
  }

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                
                <div className="col-span-2 space-y-2">
                    <FormLabel>Phone Number</FormLabel>
                    <div className="flex gap-2">
                        <Select value={phoneCountryCode} onValueChange={handleCountryChange}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country.code} value={country.phone}>
                                        +{country.phone}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className='relative w-full'>
                            <Input 
                                placeholder={selectedCountryForPhone ? '0'.repeat(selectedCountryForPhone.phoneLength) : '977123456'} 
                                value={phoneNumber}
                                onChange={handlePhoneChange}
                            />
                            {selectedCountryForPhone && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{phoneNumber.length}/{selectedCountryForPhone.phoneLength}</div>}
                        </div>
                    </div>
                    {form.formState.errors.phone && <p className="text-sm font-medium text-destructive">{form.formState.errors.phone.message}</p>}
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
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
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
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!isProviderReady || properties.length === 0 || isPropertyFull}>
                {!isProviderReady && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Tenant
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
