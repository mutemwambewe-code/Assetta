'use client';

import { useState, useEffect } from 'react';
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
import { useUtility } from './utility-provider';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Plus, CalendarIcon } from 'lucide-react';
import { useProperties } from '../properties/property-provider';
import { ScrollArea } from '../ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const utilityTypes = ["Water", "Electricity", "Garbage", "Security", "Internet", "Other"] as const;

const formSchema = z.object({
  propertyId: z.string().min(1, 'Please select a property.'),
  utilityType: z.enum(utilityTypes),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  billingPeriodStart: z.date({ required_error: 'Start date is required.' }),
  billingPeriodEnd: z.date({ required_error: 'End date is required.' }),
  dueDate: z.date({ required_error: 'Due date is required.' }),
});

type FormData = z.infer<typeof formSchema>;

export function AddUtilityBill({ children, propertyId }: { children?: React.ReactNode, propertyId?: string }) {
  const [open, setOpen] = useState(false);
  const { addUtilityBill, isInitialized } = useUtility();
  const { properties, isInitialized: propertiesReady } = useProperties();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: propertyId || '',
      utilityType: 'Electricity',
      amount: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        propertyId: propertyId || '',
        utilityType: 'Electricity',
        amount: 0,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        dueDate: new Date(),
      });
    }
  }, [open, propertyId, form]);

  function onSubmit(values: FormData) {
    const selectedProperty = properties.find(p => p.id === values.propertyId);
    if (!selectedProperty) {
      toast({ variant: "destructive", title: "Error", description: "Selected property not found." });
      return;
    }

    addUtilityBill({
      ...values,
      propertyName: selectedProperty.name,
      billingPeriodStart: values.billingPeriodStart.toISOString(),
      billingPeriodEnd: values.billingPeriodEnd.toISOString(),
      dueDate: values.dueDate.toISOString(),
    });
    
    toast({
      title: 'Utility Bill Added!',
      description: `${values.utilityType} bill for ${selectedProperty.name} has been recorded.`,
    });
    
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> :
        <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2" /> Add Bill
        </Button>
      }
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Utility Bill</DialogTitle>
          <DialogDescription>Record a new utility bill for a property.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!propertyId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {utilityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Bill Amount (ZMW)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingPeriodStart"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period Start</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
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
                 <FormField
                  control={form.control}
                  name="billingPeriodEnd"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period End</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
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
              <DialogFooter className="sticky bottom-0 bg-background py-4 px-1">
                <Button type="submit" disabled={!isInitialized || !propertiesReady}>
                  {(!isInitialized || !propertiesReady) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Bill
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
