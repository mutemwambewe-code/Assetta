'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { AppLogo } from './app-logo';
import { navLinks, settingsLink } from './nav-links';

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex transition-all duration-300">
            <TooltipProvider delayDuration={400}>
                <div className="flex flex-col items-center gap-6 px-2 py-6 h-full">
                    <Link
                        href="/dashboard"
                        className="group flex h-14 w-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-all duration-500 hover:scale-105"
                    >
                        <AppLogo className="h-10 w-10 text-primary drop-shadow-sm" />
                        <span className="sr-only">Assetta</span>
                    </Link>

                    <nav className="flex flex-col items-center gap-4 w-full">
                        {navLinks.map(({ href, label, icon: Icon, isPrimary }, index) => {
                            const isActive = pathname.startsWith(href);
                            return (
                                <React.Fragment key={href}>
                                    {index === 2 && <Separator className="w-10 my-2 opacity-50" />}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={href}
                                                className={cn(
                                                    'relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group',
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                )}
                                            >
                                                <Icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", isPrimary && "h-7 w-7")} />
                                                <span className="sr-only">{label}</span>
                                                {isActive && (
                                                    <span className="absolute -left-1 top-3 h-6 w-1 rounded-r-full bg-primary-foreground" />
                                                )}
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={10} className="font-medium">
                                            {label}
                                        </TooltipContent>
                                    </Tooltip>
                                </React.Fragment>
                            );
                        })}
                    </nav>

                    <nav className="mt-auto flex flex-col items-center gap-4 w-full">
                        <Separator className="w-10 my-2 opacity-50" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={settingsLink.href}
                                    className={cn(
                                        'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group',
                                        pathname.startsWith(settingsLink.href)
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <settingsLink.icon className="h-6 w-6 transition-transform group-hover:rotate-45" />
                                    <span className="sr-only">{settingsLink.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={10} className="font-medium">
                                {settingsLink.label}
                            </TooltipContent>
                        </Tooltip>
                    </nav>
                </div>
            </TooltipProvider>
        </aside>
    );
}
