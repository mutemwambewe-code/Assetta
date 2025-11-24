
'use client';

import React, { useState, useEffect, Children } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from './header';
import { navLinks, settingsLink } from './nav-links';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { Separator } from '../ui/separator';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isUserLoading && !user && !isAuthPage) {
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
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/dashboard"
            className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary"
          >
            <Building className="h-6 w-6" />
            <span className="sr-only">PropBot</span>
          </Link>
          <TooltipProvider>
            {navLinks.map(({ href, label, icon: Icon, isPrimary }, index) => (
              <React.Fragment key={href}>
              {index === 2 && <Separator className="my-2" />}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        pathname.startsWith(href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isPrimary && "h-6 w-6")} />
                      <span className="sr-only">{label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              </React.Fragment>
            ))}
          </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Separator className="my-2" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={settingsLink.href}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      pathname.startsWith(settingsLink.href) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                  )}
                >
                  <settingsLink.icon className="h-5 w-5" />
                  <span className="sr-only">{settingsLink.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{settingsLink.label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col sm:pl-16">
        <Header 
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
