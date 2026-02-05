
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProperties } from './property-provider';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  location: z.string().min(2, 'Location must be at least 2 characters.'),
  units: z.coerce.number().int().min(1, 'There must be at least 1 unit.'),
  type: z.enum(['Shopping Complex', 'Boarding House', 'Residential Apartments', 'House', 'Other']),
});

type FormData = z.infer<typeof formSchema>;

export function AddProperty({ children, onPropertyAdded, asChild, className }: { children?: React.ReactNode, onPropertyAdded?: (newProperty: Property) => void, asChild?: boolean, className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addProperty, isInitialized } = useProperties();
  const { toast } = useToast();

  const isDialogOpen = searchParams.get('dialog') === 'add-property';

  const setDialogOpen = (open: boolean) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (open) {
      newParams.set('dialog', 'add-property');
    } else {
      newParams.delete('dialog');
    }
    router.replace(`${pathname}?${newParams.toString()}`);
  };


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      units: 1,
      type: 'Residential Apartments',
    },
  });

  function onSubmit(values: FormData) {
    const newProperty = addProperty(values);
    
    if (newProperty) {
        toast({
        title: 'Property Added!',
        description: `${values.name} has been added to your property list.`,
        });
        if (onPropertyAdded) {
            onPropertyAdded(newProperty);
        }
    } else {
        toast({
            variant: "destructive",
            title: "Failed to Add Property",
            description: "Could not add property. Please try again later.",
        });
    }

    setDialogOpen(false);
    form.reset();
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      {children ? (
        <div onClick={() => setDialogOpen(true)}>{children}</div>
      ) : (
        <button
            onClick={() => setDialogOpen(true)}
            className={cn(
                'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                asChild ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2',
                className
            )}
        >
            <Plus className="mr-2" /> Add Property
        </button>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>Enter the details of the new property below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Kalingalinga Complex" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lusaka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Shopping Complex">Shopping Complex</SelectItem>
                      <SelectItem value="Boarding House">Boarding House</SelectItem>
                      <SelectItem value="Residential Apartments">Residential Apartments</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="units"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Units</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={!isInitialized}>
                {!isInitialized && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Property
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
