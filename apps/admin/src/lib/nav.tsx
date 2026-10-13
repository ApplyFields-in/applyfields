import type { NavGroup } from '@applyfields/ui';
import {
  Award,
  Bell,
  Briefcase,
  ClipboardList,
  Compass,
  CreditCard,
  FileText,
  Flag,
  GraduationCap,
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

/** Internal Portal menu — matching reference UI grouping */
export const NAV: NavGroup[] = [
  { items: [{ href: '/', label: 'Dashboard', icon: <LayoutDashboard />, exact: true }] },
  {
    label: 'Opportunities',
    items: [
      { href: '/opportunities?type=government_job', label: 'Jobs', icon: <Briefcase /> },
      { href: '/opportunities?type=exam', label: 'Exams', icon: <ClipboardList /> },
      { href: '/opportunities?type=scholarship', label: 'Scholarships', icon: <Award /> },
      { href: '/opportunities?type=admission', label: 'Admissions', icon: <GraduationCap /> },
      { href: '/services', label: 'Government Services', icon: <Landmark /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/review', label: 'Applications', icon: <Inbox /> },
      { href: '/users', label: 'Users', icon: <Users /> },
      { href: '/partners', label: 'Partners', icon: <Store /> },
      { href: '/assistance', label: 'Assistance Network', icon: <HandHelping /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/opportunities', label: 'Content', icon: <FileText /> },
      { href: '/updates', label: 'Announcements', icon: <Megaphone /> },
      { href: '/careers', label: 'Career Content', icon: <Compass /> },
    ],
  },
  {
    label: 'Insights & Ops',
    items: [
      { href: '/reports', label: 'Reports', icon: <Flag /> },
      { href: '/payments', label: 'Payments', icon: <CreditCard /> },
      { href: '/scrapers', label: 'Scrapers', icon: <Radar /> },
      { href: '/audit', label: 'Audit Log', icon: <ScrollText /> },
      { href: '/settings', label: 'Settings & Roles', icon: <Settings /> },
    ],
  },
];
