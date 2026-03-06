'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Settings, Sun, Moon, LogOut, User } from 'lucide-react';
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
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import React from 'react';

export function UserNav() {
    const { theme, setTheme } = useTheme();
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 overflow-hidden rounded-full border border-border/50 hover:bg-accent transition-all duration-300">
                    <Avatar className="h-9 w-9">
                        <AvatarImage asChild src={user?.photoURL || ''}>
                            {user?.photoURL ? (
                                <Image src={user.photoURL} alt={user.displayName || 'User'} width={36} height={36} className="object-cover" />
                            ) : undefined}
                        </AvatarImage>
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 p-1 glass-card border-border/50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                <DropdownMenuLabel className="font-normal p-2 pb-3">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user?.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-accent focus:text-accent-foreground rounded-md transition-colors duration-200">
                    <Link href="/settings" className="flex items-center gap-2 w-full">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="cursor-pointer focus:bg-accent focus:text-accent-foreground rounded-md transition-colors duration-200"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4 mr-2 text-muted-foreground" /> : <Moon className="w-4 h-4 mr-2 text-muted-foreground" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground rounded-md transition-colors duration-200 text-destructive"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
