'use client';

import React, { useState, useRef, useEffect, Children } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from './header';
import { navLinks, settingsLink } from './nav-links';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const [showTitle, setShowTitle] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isUserLoading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [isUserLoading, user, isAuthPage, router]);

  let pageTitle = '';
  // Extract title from children's props
  const child = Children.only(children) as React.ReactElement;
  if (child && child.props.title) {
    pageTitle = child.props.title;
  }

  useEffect(() => {
    const mainEl = mainRef.current;
    const handleScroll = () => {
      if (mainEl) {
        setShowTitle(mainEl.scrollTop > 50);
      }
    };
    mainEl?.addEventListener('scroll', handleScroll);
    return () => {
      mainEl?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname]);

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
    <div className="flex min-h-screen w-full">
      <aside className="hidden border-r bg-sidebar text-sidebar-foreground sm:flex">
        <div className="flex flex-col sticky top-0 h-screen">
          <nav className="flex flex-col items-center gap-4 px-2 py-4 flex-1">
            <Link
              href="/dashboard"
              className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary"
            >
              <Building className="h-6 w-6" />
              <span className="sr-only">PropBot</span>
            </Link>
            <TooltipProvider>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Tooltip key={href}>
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
                      <Icon className={cn("h-5 w-5", href === '/properties' && 'h-6 w-6')} />
                      <span className="sr-only">{label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
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
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <Header 
          showTitle={showTitle} 
          pageTitle={pageTitle}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main ref={mainRef} className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
