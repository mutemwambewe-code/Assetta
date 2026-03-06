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
import { ArrowLeft, CheckCircle, Edit, Loader2, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
      title: "Coming soon",
      description: "Tutorial replay will be available in a future update.",
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
    <div className="mx-auto max-w-4xl space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent sm:text-5xl">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Personalize your experience and manage your account security and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-muted/50 p-1 text-muted-foreground backdrop-blur-sm border border-border/50">
          <TabsTrigger value="profile" className="rounded-xl px-8 py-2 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg">
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-xl px-8 py-2 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg">
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8 mt-10 outline-none">
          <div className="grid gap-8 md:grid-cols-[1fr_250px]">
            <div className="space-y-8">
              <Card className="overflow-hidden border-border/50 shadow-xl shadow-primary/5 glass-card group">
                <CardHeader className="border-b border-border/10 bg-muted/20 pb-8">
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-2xl font-bold">Account Information</CardTitle>
                      <CardDescription className="text-base text-muted-foreground/80">Manage your profile details and identity.</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl font-semibold shadow-sm hover:shadow-md transition-all">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  {isUserLoading ? (
                    <div className='space-y-6'>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>
                    </div>
                  ) : user ? (
                    <>
                      {isEditing ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <FormField
                              control={form.control}
                              name="displayName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-semibold">Full Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="h-12 rounded-xl border-border/50 bg-background/50 focus:ring-primary/20" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-3 pt-2">
                              <Button variant="ghost" type="button" onClick={() => setIsEditing(false)} className="rounded-xl px-6">Cancel</Button>
                              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <div className="grid gap-6">
                          <div className="grid gap-1.5">
                            <Label htmlFor='displayName' className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                            <p id='displayName' className='text-xl font-semibold tracking-tight'>{user.displayName || 'Not set'}</p>
                          </div>

                          <Separator className="opacity-30" />

                          <div className="grid gap-1.5">
                            <Label htmlFor='email' className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                            <div className='flex items-center gap-3 flex-wrap'>
                              <p id='email' className='text-lg font-medium'>{user.email}</p>
                              {user.emailVerified ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 px-3 py-1 rounded-full">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Verified
                                </Badge>
                              ) : (
                                <div className='flex items-center gap-2'>
                                  <Badge variant="destructive" className="rounded-full px-3 py-1">Not Verified</Badge>
                                  <Button size="sm" variant="link" onClick={handleSendVerification} disabled={isSendingVerification} className="text-primary hover:text-primary/80 font-semibold p-0 h-auto">
                                    {isSendingVerification ? "Sending..." : "Resend Verification Email"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-6 text-center">
                      <p className='text-destructive font-semibold font-medium'>Could not load user information.</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4 rounded-xl">Retry Load</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg shadow-primary/5 glass-card">
                <CardHeader>
                  <CardTitle className="text-xl">Safety & Privacy</CardTitle>
                  <CardDescription>Security settings to keep your account safe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="space-y-0.5">
                      <p className="font-semibold">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">SOON</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/20 bg-primary/5 shadow-xl shadow-primary/10 glass-card">
                <CardHeader className="pb-3 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                  <CardTitle className="text-primary text-xl font-bold">Pro Account</CardTitle>
                  <CardDescription className="text-primary/70 font-medium">Lifetime Access Active</CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    You have unlocked all premium features of Assetta. Enjoy unlimited property management tools.
                  </p>
                </CardContent>
              </Card>

              <div className="rounded-2xl border border-border/50 bg-muted/20 p-6 space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
                <div className="grid gap-2">
                  <Button variant="outline" className="w-full justify-start rounded-xl font-semibold border-border/50 hover:bg-background shadow-sm hover:shadow-md transition-all">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-8 mt-10 outline-none">
          <div className="grid gap-8 sm:grid-cols-2">
            <Card className="border-border/50 shadow-xl shadow-primary/5 glass-card group transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                  {theme === 'dark' ? <Moon className="h-5 w-5 text-orange-500" /> : <Sun className="h-5 w-5 text-orange-500" />}
                </div>
                <CardTitle className="text-xl">Theme</CardTitle>
                <CardDescription>Switch between dark and light modes.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                  <Label htmlFor="dark-mode" className="font-bold cursor-pointer">Dark Mode</Label>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-xl shadow-primary/5 glass-card group transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                  <Edit className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Tutorial Status</CardTitle>
                <CardDescription>Manage your onboarding experience.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={handleReplayTutorial}
                  variant="outline"
                  className="w-full h-14 rounded-xl font-bold border-border/50 hover:bg-background shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Loader2 className="h-4 w-4 text-muted-foreground" />
                  Replay Introductory Tutorial
                </Button>
              </CardContent>
            </Card>

            <Card className="col-span-full border-border/50 shadow-xl shadow-primary/5 glass-card opacity-80 hover:opacity-100 transition-opacity">
              <CardHeader>
                <CardTitle className="text-xl">Notification Preferences</CardTitle>
                <CardDescription>Choose what updates you want to receive.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 'email-prod', label: 'Product Updates', desc: 'New feature announcements and improvements.' },
                    { id: 'email-sec', label: 'Security Alerts', desc: 'Critical alerts about your account safety.' },
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
                      <div className="space-y-1">
                        <Label htmlFor={pref.id} className="font-bold">{pref.label}</Label>
                        <p className="text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                      <Switch id={pref.id} disabled checked={pref.id === 'email-sec'} />
                    </div>
                  ))}
                  <p className="text-[10px] text-center text-muted-foreground font-medium pt-2">
                    Advanced notification controls are being beta tested and will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


SettingsPage.title = 'Settings';
export default SettingsPage;
