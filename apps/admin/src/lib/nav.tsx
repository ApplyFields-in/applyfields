import type { NavGroup } from '@applyfields/ui';
import {
  Bell,
  Briefcase,
  Compass,
  CreditCard,
  Flag,
  HandHelping,
  Inbox,
  Landmark,
  LayoutDashboard,
  Megaphone,
  Radar,
  ScrollText,
  Settings,
  Store,
  Users,
} from 'lucide-react';

/** Internal Portal menu — follows the founder document §22. */
export const NAV: NavGroup[] = [
  { items: [{ href: '/', label: 'Dashboard', icon: <LayoutDashboard />, exact: true }] },
  {
    label: 'Content',
    items: [
      { href: '/review', label: 'Review queue', icon: <Inbox /> },
      { href: '/opportunities', label: 'Opportunities', icon: <Briefcase /> },
      { href: '/updates', label: 'Results & updates', icon: <Megaphone /> },
      { href: '/services', label: 'Government services', icon: <Landmark /> },
      { href: '/careers', label: 'Career content', icon: <Compass /> },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/users', label: 'Users', icon: <Users /> },
      { href: '/partners', label: 'Partners', icon: <Store /> },
      { href: '/assistance', label: 'Assistance network', icon: <HandHelping /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/notifications', label: 'Notifications', icon: <Bell /> },
      { href: '/reports', label: 'Reports & complaints', icon: <Flag /> },
      { href: '/payments', label: 'Payments', icon: <CreditCard /> },
      { href: '/scrapers', label: 'Scrapers', icon: <Radar /> },
      { href: '/audit', label: 'Audit log', icon: <ScrollText /> },
      { href: '/settings', label: 'Settings & roles', icon: <Settings /> },
    ],
  },
];
