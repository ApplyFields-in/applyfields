import type { NavGroup } from '@applyfields/ui';
import {
  Award,
  BadgeCheck,
  Bell,
  Bookmark,
  BookOpen,
  Bot,
  Briefcase,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  HandHelping,
  House,
  Landmark,
  LifeBuoy,
  Lightbulb,
  Megaphone,
  Route,
  School,
  Settings,
  University,
  UserRound,
} from 'lucide-react';

/** Main menu of the citizen website — follows the founder document's navigation (§25). */
export const NAV: NavGroup[] = [
  { items: [{ href: '/', label: 'Home', icon: <House />, exact: true }] },
  {
    label: 'Apply',
    items: [
      { href: '/jobs', label: 'Government jobs', icon: <Briefcase /> },
      { href: '/exams', label: 'Exams', icon: <GraduationCap /> },
      { href: '/scholarships', label: 'Scholarships', icon: <Award /> },
      { href: '/services', label: 'Government services', icon: <Landmark /> },
      { href: '/admissions', label: 'Admissions', icon: <School /> },
      { href: '/updates', label: 'Results & updates', icon: <Megaphone /> },
      { href: '/eligibility', label: 'Eligibility check', icon: <BadgeCheck /> },
    ],
  },
  {
    label: 'Career',
    items: [
      { href: '/career', label: 'Explore careers', icon: <Compass />, exact: true },
      { href: '/career/roadmaps', label: 'Roadmaps', icon: <Route /> },
      { href: '/career/skills', label: 'Skills', icon: <Lightbulb /> },
      { href: '/career/courses', label: 'Courses', icon: <BookOpen /> },
      { href: '/career/colleges', label: 'Colleges & universities', icon: <University /> },
      { href: '/career/guidance', label: 'Career guidance (AI)', icon: <Bot /> },
    ],
  },
  {
    label: 'My space',
    items: [
      { href: '/saved', label: 'Saved', icon: <Bookmark /> },
      { href: '/applications', label: 'My applications', icon: <ClipboardList /> },
      { href: '/notifications', label: 'Notifications', icon: <Bell /> },
      { href: '/documents', label: 'My documents', icon: <FileText /> },
      { href: '/assistance', label: 'Find assistance', icon: <HandHelping /> },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: <UserRound /> },
      { href: '/account', label: 'Account & plans', icon: <Settings /> },
      { href: '/help', label: 'Help centre', icon: <LifeBuoy /> },
    ],
  },
];
