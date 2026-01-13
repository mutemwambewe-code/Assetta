'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// This interface is needed to extend the Window object with the onbeforeinstallprompt property
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast, dismiss } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(event);
      
      // Show a custom toast notification
      const { id, update } = toast({
        duration: Infinity, // Keep the toast open until dismissed
        title: 'Install Assetta App',
        description: 'Get a better experience by installing the app on your device.',
        action: (
          <Button
            onClick={() => handleInstallClick(event)}
          >
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
        ),
      });
    };
    
    // Check if the app is already installed
    if (typeof window !== 'undefined' && !window.matchMedia('(display-mode: standalone)').matches) {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }


    const handleInstallClick = async (event: BeforeInstallPromptEvent) => {
        if (!event) return;

        // Show the browser's install prompt.
        event.prompt();

        // Wait for the user to respond to the prompt.
        const { outcome } = await event.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We can only use the prompt once, so clear it.
        setInstallPrompt(null);
        dismiss(); // Dismiss the toast
    };

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast, dismiss]);

  return null; // This component does not render anything itself
}
