
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Edit, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BillingSettings } from '@/components/settings/billing-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateProfile, sendEmailVerification } from 'firebase/auth';

const formSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
});

type FormData = z.infer<typeof formSchema>;

function SettingsPage({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName || '' });
    }
  }, [user, form]);

  const handleReplayTutorial = () => {
    toast({
      title: "Feature coming soon!",
      description: "The tutorial feature is not yet implemented.",
    });
  };

  async function onSubmit(values: FormData) {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to update your profile." });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: values.displayName,
      });
      toast({
        title: "Profile Updated",
        description: "Your name has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendVerification() {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
      return;
    }
    setIsSendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for a verification link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Sending Email",
        description: error.message || "Could not send verification email. Please try again.",
      });
    } finally {
      setIsSendingVerification(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings, billing, and preferences.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal account details.</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isUserLoading ? (
                <div className='space-y-4'>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ) : user ? (
                <>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor='displayName'>Full Name</Label>
                        <p id='displayName' className='text-muted-foreground'>{user.displayName || 'Not set'}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor='email'>Email Address</Label>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <p id='email' className='text-muted-foreground'>{user.email}</p>
                          {user.emailVerified ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <div className='flex items-center gap-2'>
                              <Badge variant="destructive">Not Verified</Badge>
                              <Button size="sm" variant="outline" onClick={handleSendVerification} disabled={isSendingVerification}>
                                {isSendingVerification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Verification
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor='role'>Account Role</Label>
                          <div className='flex items-center gap-2'>
                            <p id='role' className='text-muted-foreground'>{userProfile?.role}</p>
                            {userProfile?.role === 'ADMIN' && <Badge variant="success" className='gap-1'><ShieldCheck className="h-3 w-3" /> Administrator</Badge>}
                          </div>
                        </div>
                      </>
                  )}
                    </>
                  ) : (
                  <p className='text-muted-foreground'>Could not load user information.</p>
              )}
                </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications. (Coming soon)</CardDescription>
            </CardHeader>
            <CardContent className='opacity-50'>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch id="email-notifications" disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tutorial</CardTitle>
              <CardDescription>Need a refresher? Replay the introductory tutorial.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleReplayTutorial}>Replay Tutorial</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

SettingsPage.title = 'Settings';
export default SettingsPage;
