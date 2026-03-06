'use client';

import React, { useEffect, Children } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from './header';
import { navLinks, settingsLink } from './nav-links';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { Separator } from '../ui/separator';
import { IntroTutorial } from '../tutorial/intro-tutorial';
import { AppLogo } from './app-logo';

import { Sidebar } from './sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (isUserLoading) return;

    if (!user && !isAuthPage) {
      router.push('/login');
    }
  }, [isUserLoading, user, isAuthPage, router]);

  let pageTitle = '';
  if (Children.only(children) && React.isValidElement(children)) {
    const child = children as React.ReactElement;
    if (child.type && (child.type as any).title) {
      pageTitle = (child.type as any).title;
    }
  }

  if (isUserLoading && !isAuthPage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background/50">
      <Sidebar />
      <div className="flex flex-1 flex-col sm:pl-20 transition-all duration-300">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-500">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        <IntroTutorial />
      </div>
    </div>
  );
}

