
'use client';

import { useTheme } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function SettingsPage({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  const handleReplayTutorial = () => {
    toast({
      title: "Feature coming soon!",
      description: "The tutorial feature is not yet implemented.",
    })
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
                Manage your account settings, preferences, and more.
            </p>
        </div>
         <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the app.
          </CardDescription>
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
          <CardDescription>
            Manage how you receive notifications. (Coming soon)
          </CardDescription>
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
          <CardDescription>
            Need a refresher? Replay the introductory tutorial.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={handleReplayTutorial}>Replay Tutorial</Button>
        </CardContent>
      </Card>

    </div>
  );
}

SettingsPage.title = 'Settings';
export default SettingsPage;
