'use client';

import { AppProviders } from '@/components/providers/app-providers';
import { FirebaseClientProvider } from '@/firebase';
import { PropertyProvider } from '@/components/properties/property-provider';
import { TenantProvider } from '@/components/tenants/tenant-provider';
import { TemplateProvider } from '@/components/communication/template-provider';
import { MessageLogProvider } from '@/components/communication/message-log-provider';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { TutorialProvider } from '../tutorial/tutorial-provider';
import { IntroTutorial } from '../tutorial/intro-tutorial';
import { InstallPrompt } from '../pwa/install-prompt';
import { UtilityProvider } from '../utilities/utility-provider';
import { FeedbackPrompt } from '../feedback/feedback-prompt';
import { SubscriptionProvider } from '@/hooks/use-subscription';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <FirebaseClientProvider>
        <SubscriptionProvider>
          <TutorialProvider>
            <PropertyProvider>
              <TenantProvider>
                <TemplateProvider>
                  <MessageLogProvider>
                    <UtilityProvider>
                      <AppLayout>
                        <>
                          {children}
                          <InstallPrompt />
                          <FeedbackPrompt />
                        </>
                      </AppLayout>
                    </UtilityProvider>
                  </MessageLogProvider>
                </TemplateProvider>
              </TenantProvider>
            </PropertyProvider>
            <Toaster />
          </TutorialProvider>
        </SubscriptionProvider>
      </FirebaseClientProvider>
    </AppProviders>
  );
}
