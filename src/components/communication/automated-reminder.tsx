
'use client';

import { automatedCommunication, type AutomatedCommunicationOutput } from '@/ai/flows/automated-communication';
import { useTenants } from '@/components/tenants/tenant-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { Loader2, Send, Wand2, Eye, Pencil, Users, ChevronDown, X, AlertTriangle, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Form, FormItem, FormControl } from '../ui/form';
import { useMessageLog } from './message-log-provider';
import type { Tenant } from '@/lib/types';
import { useProperties } from '../properties/property-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MessageTemplates } from './message-templates';
import { sendSms } from '@/app/actions/send-sms';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';

const formSchema = z.object({
  tenantId: z.string().optional(),
  recipientType: z.enum(['individual', 'group']).default('individual'),
  groupId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const tags = ['name', 'rent_due', 'arrears', 'due_date', 'property', 'lease_end_date'];

interface AutomatedReminderProps {
    message: string;
    setMessage: (message: string) => void;
}

const replacePlaceholders = (message: string, tenant?: Tenant): string => {
    if (!tenant) return message;

    const arrears = tenant.rentStatus === 'Overdue' ? tenant.rentAmount : 0;
    const dueDate = new Date(); // Using today as a proxy for due date
    dueDate.setDate(5); // Assuming due date is the 5th
  
    return message
      .replace(/{{name}}/g, tenant.name)
      .replace(/{{rent_due}}/g, tenant.rentAmount.toLocaleString())
      .replace(/{{arrears}}/g, arrears.toLocaleString())
      .replace(/{{due_date}}/g, dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }))
      .replace(/{{property}}/g, tenant.property)
      .replace(/{{lease_end_date}}/g, new Date(tenant.leaseEndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  };

export function AutomatedReminder({ message, setMessage }: AutomatedReminderProps) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { tenants } = useTenants();
  const { properties } = useProperties();
  const { addMessageLog, updateMessageStatus } = useMessageLog();
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('write');
  const [previewMessage, setPreviewMessage] = useState('');
  const messageBoxRef = useRef<HTMLDivElement>(null);
  const [isTextareaHighlighted, setIsTextareaHighlighted] = useState(false);
  const [editableRecipients, setEditableRecipients] = useState<Tenant[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: searchParams.get('tenantId') || '',
      recipientType: searchParams.get('tenantId') ? 'individual' : 'group',
      groupId: '',
    },
  });

  const { control, handleSubmit, watch, formState: { errors }, setValue, getValues } = form;

  const selectedTenantId = watch('tenantId');
  const recipientType = watch('recipientType');
  const groupId = watch('groupId');
  
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  const getRecipientsForGroup = (selectedGroupId: string | undefined): Tenant[] => {
    if (!selectedGroupId) return [];
    if (selectedGroupId === 'all') return tenants;
    if (selectedGroupId === 'arrears') return tenants.filter(t => t.rentStatus === 'Overdue');
    if (selectedGroupId === 'pending') return tenants.filter(t => t.rentStatus === 'Pending');
    if (selectedGroupId.startsWith('prop-')) {
      const propId = selectedGroupId.replace('prop-', '');
      const prop = properties.find(p => p.id === propId);
      if (prop) return tenants.filter(t => t.property === prop.name);
    }
    return [];
  };
  
  const handleGroupSelection = (value: string) => {
    const newRecipients = getRecipientsForGroup(value);
    setValue('groupId', value);
    setEditableRecipients(newRecipients);
    setPopoverOpen(false);
  };


  const previewTenant = useMemo(() => {
    if (recipientType === 'individual') return selectedTenant;
    if (editableRecipients.length > 0) return editableRecipients[0];
    if (tenants.length > 0) return tenants[0];
    return undefined;
  }, [recipientType, selectedTenant, editableRecipients, tenants]);


  const bulkGroups = [
    { id: 'all', name: 'All Tenants' },
    { id: 'arrears', name: 'Tenants in Arrears' },
    { id: 'pending', name: 'Tenants with Pending Payments' },
    ...properties.map(p => ({id: `prop-${p.id}`, name: `All Tenants in ${p.name}`})),
  ];
  
  useEffect(() => {
    const tenantIdFromParams = searchParams.get('tenantId');
    if (tenantIdFromParams) {
        setValue('tenantId', tenantIdFromParams);
        setValue('recipientType', 'individual');
    }
  }, [searchParams, setValue]);

  const handleSend = async () => {
    if (!message) return;
    setIsSending(true);

    let recipients: Tenant[] = [];
    if (recipientType === 'individual' && selectedTenant) {
      recipients.push(selectedTenant);
    } else if (recipientType === 'group' && groupId) {
      recipients = editableRecipients;
    }
    
    if(recipients.length === 0) {
      toast({
        variant: "destructive",
        title: "No recipients found",
        description: "Please select a valid tenant or group with members."
      });
      setIsSending(false);
      return;
    }
    
    let allSuccessful = true;
    let firstErrorMessage = '';

    for (const tenant of recipients) {
      const personalizedMessage = replacePlaceholders(message, tenant);
      const localMessageId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await addMessageLog({
        id: localMessageId,
        tenantId: tenant.id,
        tenantName: tenant.name,
        message: personalizedMessage,
        date: new Date().toISOString(),
        method: 'SMS',
        direction: 'outgoing',
        status: 'Sending...'
      });

      const res = await sendSms([tenant.phone], personalizedMessage);

      if (!res.success) {
        allSuccessful = false;
        if (!firstErrorMessage) {
          firstErrorMessage = res.message;
        }
        await updateMessageStatus(localMessageId, `Failed: ${res.message}`);
      } else {
        await updateMessageStatus(localMessageId, 'Sent', res.response?.SMSMessageData?.Recipients[0]?.messageId);
      }
    }

    if (allSuccessful) {
      toast({
        title: "Messages Sent!",
        description: `Your message has been queued for sending to ${recipients.length} tenant(s). Check logs for delivery status.`
      });
      setMessage('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Sending Failed',
        description: firstErrorMessage || 'One or more messages could not be sent. Please check the logs and your configuration.',
      });
    }

    setIsSending(false);
  }

  const handleRemoveRecipient = (tenantId: string) => {
    setEditableRecipients(prev => prev.filter(t => t.id !== tenantId));
  }


  const handleTagClick = (tag: string) => {
    setMessage(prev => `${prev} {{${tag}}}`);
  };

  const handleTemplateSelect = (content: string) => {
    setMessage(content);
    setActiveTab('write');
    setTimeout(() => {
        messageBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsTextareaHighlighted(true);
        setTimeout(() => setIsTextareaHighlighted(false), 1500);
    }, 100);
  }

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    if (tabValue === 'preview') {
        setPreviewMessage(replacePlaceholders(message, previewTenant));
    }
  }

  const isSendDisabled = !message || isSending || (recipientType === 'individual' && !selectedTenantId) || (recipientType === 'group' && (!groupId || editableRecipients.length === 0));

  return (
    <Card className="mt-4 border-none shadow-none">
      <Form {...form}>
        <form>
            <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>Select recipients and write your message.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            
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
                    <FormControl>
                      <RadioGroupItem value="individual" id="individual" />
                    </FormControl>
                    <Label htmlFor="individual">Individual Tenant</Label>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="group" id="group" />
                    </FormControl>
                    <Label htmlFor="group">Bulk Group</Label>
                  </FormItem>
                </RadioGroup>
              )}
            />
            
            {recipientType === 'individual' ? (
              <div className="space-y-2">
                <Label htmlFor="tenantId">Select Tenant</Label>
                <Controller
                  name="tenantId"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                      }} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger id="tenantId">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.property} - {tenant.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tenantId && <p className="text-sm text-destructive">{errors.tenantId.message}</p>}
              </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="groupId">Select Group</Label>
                         <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={popoverOpen}
                              className="w-full justify-between"
                            >
                              {groupId
                                ? bulkGroups.find((group) => group.id === groupId)?.name
                                : "Select a bulk group"}
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
                                    <CommandItem
                                      key={group.id}
                                      value={group.id}
                                      onSelect={() => {
                                        handleGroupSelection(group.id);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          groupId === group.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
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
                                            <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-full"
                                            onClick={() => handleRemoveRecipient(tenant.id)}
                                        >
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


            <div className="space-y-2" ref={messageBoxRef}>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value="write"><Pencil className='mr-2'/> Write</TabsTrigger>
                        <TabsTrigger value="preview" disabled={!previewTenant}><Eye className='mr-2' /> Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="write" className='mt-4'>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map(tag => (
                                <Badge 
                                    key={tag}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-accent"
                                    onClick={() => handleTagClick(tag)}
                                >
                                    {tag.replace(/_/g, ' ')}
                                </Badge>
                            ))}
                        </div>
                        <Textarea 
                            id="message" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            rows={6}
                            placeholder="Type your message here. Use tags like {{name}}."
                            className={cn(
                                'transition-all duration-300',
                                isTextareaHighlighted && 'ring-2 ring-primary ring-offset-2'
                            )}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {message.length} chars ({Math.ceil(message.length / 160)} SMS)
                        </p>
                    </TabsContent>
                    <TabsContent value="preview" className='mt-4'>
                        <div className="p-4 border rounded-md bg-muted/20 min-h-[170px] text-sm whitespace-pre-wrap">
                            {previewMessage}
                        </div>
                         <p className="text-xs text-muted-foreground mt-2">
                            {recipientType === 'group' && editableRecipients.length > 0
                                ? `This is a preview using ${editableRecipients[0].name} as a sample. Each tenant in the group will receive a personalized message.`
                                : `This is a preview for ${previewTenant?.name}.`
                            }
                        </p>
                    </TabsContent>
                </Tabs>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end items-center border-t pt-6">
            <Button onClick={handleSend} disabled={isSendDisabled}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Message
            </Button>
          </CardFooter>
        </form>
      </Form>

      <MessageTemplates onTemplateSelect={handleTemplateSelect} />

    </Card>
  );
}

    

    

    