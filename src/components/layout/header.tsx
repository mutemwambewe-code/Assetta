'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeft, Settings, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '@/components/providers/app-providers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { navLinks, settingsLink } from './nav-links';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import React from 'react';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { AppWordmark } from './app-wordmark';
import { UserNav } from './user-nav';

interface HeaderProps {
  pageTitle: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const pathname = usePathname();
  const [showTitle, setShowTitle] = React.useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const mainEl = document.querySelector('main');
    const handleScroll = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (target) {
        setShowTitle(target.scrollTop > 20);
      }
    };
    mainEl?.addEventListener('scroll', handleScroll);
    return () => mainEl?.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/60 px-4 backdrop-blur-md transition-all duration-300 sm:px-6"
    >
      <div className='flex items-center gap-4'>
        <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden hover:bg-accent/50">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col p-0 glass-card">
            <SheetHeader className="p-6 border-b border-sidebar-border/50">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Link
                href="/dashboard"
                className="group flex h-auto shrink-0 items-center justify-start gap-2"
              >
                <AppWordmark className="h-12 w-auto" />
              </Link>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <nav className="grid gap-2 p-4">
                {navLinks.map(({ href, label, icon: Icon }, index) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <React.Fragment key={href}>
                      {index === 2 && <Separator className="my-4 bg-sidebar-border/30 mx-2" />}
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    </React.Fragment>
                  );
                })}
              </nav>
            </ScrollArea>
            <div className="mt-auto border-t border-sidebar-border/50 p-4">
              <Link
                href={settingsLink.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  pathname.startsWith(settingsLink.href)
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <settingsLink.icon className="h-5 w-5 transition-transform group-hover:rotate-45" />
                {settingsLink.label}
              </Link>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="hidden items-center gap-2 sm:flex">
          <AppWordmark className="h-12 w-auto transition-transform hover:scale-105 duration-300" />
        </Link>
      </div>

      <div className="flex-1">
        <div className={cn(
          "flex justify-center transition-all duration-300",
          showTitle ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}>
          <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <UserNav />
      </div>
    </header>
  );
}

