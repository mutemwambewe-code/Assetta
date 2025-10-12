import { Home, Users, MessageSquare, BarChart, Settings, type LucideIcon, Building } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Properties', icon: Building },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/communication', label: 'Communication', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: BarChart },
];

export const settingsLink: NavLink = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
};
