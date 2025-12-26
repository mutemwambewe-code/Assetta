
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeft, Settings, Sun, Moon, Building, LogOut } from 'lucide-react';
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

interface HeaderProps {
  pageTitle: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showTitle, setShowTitle] = React.useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const mainEl = document.querySelector('main');
    const handleScroll = (e: Event) => {
        const target = e.currentTarget as HTMLElement;
        if(target) {
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
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header 
        className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6"
        style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
    >
       <div className='flex items-center gap-4'>
        <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col p-0">
            <SheetHeader className="p-4 border-b border-sidebar-border">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                 <Link
                    href="/dashboard"
                    className="group flex h-10 shrink-0 items-center justify-start gap-2 text-lg font-semibold text-primary md:text-base"
                    >
                    <Building className="h-6 w-6" />
                    <span className="font-bold text-xl text-foreground">Assetta</span>
                </Link>
            </SheetHeader>
            <ScrollArea className="flex-1">
                <nav className="grid gap-4 text-lg font-medium p-4">
                    {navLinks.map(({ href, label, icon: Icon }, index) => (
                    <React.Fragment key={href}>
                    {index === 2 && <Separator className="my-2 bg-sidebar-border" />}
                    <Link
                        href={href}
                        className={cn("flex items-center gap-4 px-2.5 rounded-lg py-2",
                        pathname.startsWith(href)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                    </Link>
                    </React.Fragment>
                    ))}
                </nav>
            </ScrollArea>
             <div className="mt-auto border-t border-sidebar-border p-4">
                 <Link
                    href={settingsLink.href}
                    className={cn("flex items-center gap-4 px-2.5 rounded-lg py-2",
                    pathname.startsWith(settingsLink.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <settingsLink.icon className="h-5 w-5" />
                    {settingsLink.label}
                </Link>
             </div>
            </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="hidden items-center gap-2 text-primary sm:flex">
            <Building className="h-6 w-6" />
            <span className="font-bold text-xl">Assetta</span>
        </Link>
       </div>
      
      <div className="flex-1">
        <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300",
            showTitle ? "opacity-100" : "opacity-0 -translate-y-4 pointer-events-none"
          )}>
          <h1 className="font-semibold text-lg">{pageTitle}</h1>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
            <Avatar className="h-9 w-9">
              {user?.photoURL && (
                <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
              )}
              <AvatarFallback>{user?.displayName?.charAt(0) ?? user?.email?.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
             <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="w-4 h-4"/>
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="w-4 h-4 mr-2"/> : <Moon className="w-4 h-4 mr-2"/>}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
