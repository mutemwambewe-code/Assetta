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

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <FirebaseClientProvider>
        <TutorialProvider>
          <PropertyProvider>
            <TenantProvider>
              <TemplateProvider>
                <MessageLogProvider>
                  <AppLayout>{children}</AppLayout>
                  {/* <IntroTutorial /> */}
                </MessageLogProvider>
              </TemplateProvider>
            </TenantProvider>
          </PropertyProvider>
          <Toaster />
        </TutorialProvider>
      </FirebaseClientProvider>
    </AppProviders>
  );
}
