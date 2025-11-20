
'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
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
import type { Tenant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { Upload, Trash2, MoreVertical } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useProperties } from '../properties/property-provider';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { countries } from '@/lib/countries';
import { Combobox } from '../ui/combobox';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Phone number seems too short.'),
  property: z.string().min(1, 'Please select a property.'),
  unit: z.string().min(1, 'Unit is required.'),
  rentAmount: z.coerce.number().min(1, 'Rent amount must be positive.'),
  leaseStartDate: z.string().min(1, 'Lease start date is required.'),
  leaseEndDate: z.string().min(1, 'Lease end date is required.'),
  rentStatus: z.enum(['Paid', 'Pending', 'Overdue']),
  avatarUrl: z.string().optional(),
}).refine(data => {
    const phoneWithCode = data.phone;
    if (!phoneWithCode.startsWith('+')) return false;

    const country = countries.find(c => phoneWithCode.startsWith(`+${c.phone}`));
    if (!country) return true;
    
    const numberPart = phoneWithCode.replace(`+${country.phone}`, '');
    return numberPart.length === country.phoneLength;
}, {
    message: 'Phone number has an incorrect number of digits for the selected country.',
    path: ['phone'],
});

type FormData = z.infer<typeof formSchema>;

interface EditTenantProps {
  tenant: Tenant;
  children?: React.ReactNode;
}

export function EditTenant({ tenant, children }: EditTenantProps) {
  const [open, setOpen] = useState(false);
  const { updateTenant } = useTenants();
  const { properties } = useProperties();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: tenant,
  });
  
  const countryOptions = useMemo(() => countries.map(c => ({
    value: c.phone,
    label: `${c.label} (+${c.phone})`
  })), []);
  
  const selectedCountryForPhone = countries.find(c => c.phone === phoneCountryCode);

  useEffect(() => {
    if (open && tenant.phone) {
        const country = countries.find(c => tenant.phone.startsWith(`+${c.phone}`));
        if (country) {
            setPhoneCountryCode(country.phone);
            setPhoneNumber(tenant.phone.substring(country.phone.length + 1));
        } else {
            // Fallback for numbers not in our list
            const defaultCountry = countries[0];
            setPhoneCountryCode(defaultCountry.phone);
            setPhoneNumber(tenant.phone);
        }
    }
  }, [tenant.phone, open]);


  function onSubmit(values: FormData) {
    const updatedTenant: Tenant = {
      ...tenant,
      ...values,
      avatarUrl: avatarPreview || values.avatarUrl || '',
    };
    updateTenant(updatedTenant);
    toast({
      title: 'Tenant Updated!',
      description: `${updatedTenant.name}'s details have been updated.`,
    });
    setOpen(false);
  }
  
  const handleOpenChange = (isOpen: boolean) => {
      if(isOpen) {
          form.reset(tenant);
          setAvatarPreview(tenant.avatarUrl);
      }
      setOpen(isOpen);
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDeletePhoto = () => {
    setAvatarPreview('');
    form.setValue('avatarUrl', '');
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarPreview(dataUrl);
        form.setValue('avatarUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
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
    setPhoneNumber(''); // Reset phone number when country changes
    form.setValue('phone', `+${value}`);
  }


  const currentAvatar = avatarPreview ?? form.watch('avatarUrl');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>Update the details for {tenant.name}.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-6">
                <div className="flex flex-col items-center pt-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="relative group cursor-pointer">
                                <Avatar className="h-24 w-24">
                                {currentAvatar ? (
                                    <AvatarImage asChild src={currentAvatar}>
                                        <Image src={currentAvatar} alt={tenant.name} width={96} height={96} />
                                    </AvatarImage>
                                ) : null}
                                <AvatarFallback className="text-3xl">
                                    {tenant.name.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={handleUploadClick}>
                                <Upload className="mr-2" /> Upload new photo
                            </DropdownMenuItem>
                            {currentAvatar && (
                                <DropdownMenuItem onSelect={handleDeletePhoto} className="text-destructive">
                                    <Trash2 className="mr-2" /> Delete photo
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

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
                            <Combobox
                                options={countryOptions}
                                value={phoneCountryCode}
                                onChange={handleCountryChange}
                                placeholder="Country"
                                searchPlaceholder='Search country...'
                                className='w-[150px]'
                            />
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

                <FormField
                    control={form.control}
                    name="property"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Property</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {properties.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

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
                            <FormItem>
                            <FormLabel>Lease Start</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="leaseEndDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lease End</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="rentStatus"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rent Status (Manual Override)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select rent status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="sticky bottom-0 bg-background py-4 -mx-6 px-6">
                <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
