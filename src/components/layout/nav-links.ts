import { Home, Users, MessageSquare, BarChart, Settings, type LucideIcon, Building, ReceiptText } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  isPrimary?: boolean;
};

export const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Properties', icon: Building, isPrimary: true },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/utilities', label: 'Utilities', icon: ReceiptText },
  { href: '/communication', label: 'Communication', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: BarChart },
];

export const settingsLink: NavLink = {
  href: '/settings',
  label: 'Settings',
  icon: Settings,
};
