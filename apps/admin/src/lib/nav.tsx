import type { NavGroup } from '@applyfields/ui';
import {
  Award,
  Bell,
  Briefcase,
  Building,
  ClipboardList,
  Clock,
  Compass,
  CreditCard,
  Flag,
  GraduationCap,
  HandHelping,
  Inbox,
  Landmark,
  Layers,
  LifeBuoy,
  LayoutDashboard,
  Megaphone,
  Radar,
  Scale,
  ScrollText,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';

export type DepartmentType = 'super_admin' | 'partners' | 'services' | 'apply' | 'career';

export interface DepartmentMeta {
  id: DepartmentType;
  name: string;
  shortLabel: string;
  badge: string;
  description: string;
  homePath: string;
}

export const DEPARTMENTS: Record<DepartmentType, DepartmentMeta> = {
  super_admin: {
    id: 'super_admin',
    name: 'Everything',
    shortLabel: 'Everything',
    badge: 'Admin',
    description: 'All of ApplyFields: content, partners, services, people and settings.',
    homePath: '/',
  },
  partners: {
    id: 'partners',
    name: 'Partners',
    shortLabel: 'Partners',
    badge: 'Support',
    description: 'Approve service centres and colleges, and help them run their desks.',
    homePath: '/partners',
  },
  services: {
    id: 'services',
    name: 'Citizen services',
    shortLabel: 'Citizen services',
    badge: 'Support',
    description: 'The services catalog and help requests from citizens.',
    homePath: '/services',
  },
  apply: {
    id: 'apply',
    name: 'Content',
    shortLabel: 'Content',
    badge: 'Review',
    description: 'Review scraped notices and publish jobs, exams, scholarships and admissions.',
    homePath: '/review',
  },
  career: {
    id: 'career',
    name: 'Colleges & careers',
    shortLabel: 'Colleges & careers',
    badge: 'Review',
    description: 'College pages, courses and career paths.',
    homePath: '/colleges',
  },
};

/**
 * One name per page, used in every sidebar, so the same page is never called two different things.
 * Department sidebars below also decide which pages limited staff may open (canOpenPath), so their
 * page lists only change on purpose.
 */
const PAGE = {
  overview: { href: '/', label: 'Overview', icon: <LayoutDashboard />, exact: true },
  review: { href: '/review', label: 'Review queue', icon: <Inbox /> },
  opportunities: { href: '/opportunities', label: 'Opportunities', icon: <Briefcase /> },
  updates: { href: '/updates', label: 'Announcements', icon: <Megaphone /> },
  scrapers: { href: '/scrapers', label: 'Scrapers', icon: <Radar /> },
  sources: { href: '/sources', label: 'Scraper sources', icon: <Layers /> },
  centres: { href: '/partners', label: 'Service centres', icon: <Store />, exact: true },
  collegePartners: { href: '/partners/colleges', label: 'College partners', icon: <GraduationCap /> },
  enquiries: { href: '/partners/enquiries', label: 'Student enquiries', icon: <ClipboardList /> },
  partnerMap: { href: '/partners/map', label: 'Partner map', icon: <Compass /> },
  services: { href: '/services', label: 'Services catalog', icon: <Landmark /> },
  assistance: { href: '/assistance', label: 'Help requests', icon: <HandHelping /> },
  disputes: { href: '/disputes', label: 'Disputes & refunds', icon: <Scale /> },
  support: { href: '/support', label: 'Support inbox', icon: <LifeBuoy /> },
  payments: { href: '/payments', label: 'Payments', icon: <CreditCard /> },
  colleges: { href: '/colleges', label: 'Colleges', icon: <Building /> },
  careers: { href: '/careers', label: 'Careers', icon: <Award /> },
  users: { href: '/users', label: 'Users', icon: <Users /> },
  staff: { href: '/settings', label: 'Staff & roles', icon: <ShieldCheck /> },
  notifications: { href: '/notifications', label: 'Notifications', icon: <Bell /> },
  analytics: { href: '/analytics', label: 'Analytics', icon: <TrendingUp /> },
  reports: { href: '/reports', label: 'Reports', icon: <Flag /> },
  audit: { href: '/audit', label: 'Activity log', icon: <ScrollText /> },
  scheduled: { href: '/scheduled-tasks', label: 'Scheduled jobs', icon: <Clock /> },
};
const home = (item: (typeof PAGE)[keyof typeof PAGE]) => ({ ...item, exact: true });

/** Full admins: every page, grouped by the job it is for. */
export const SUPER_ADMIN_NAV: NavGroup[] = [
  { items: [PAGE.overview] },
  { label: 'Content', items: [PAGE.review, PAGE.opportunities, PAGE.updates, PAGE.scrapers, PAGE.sources] },
  { label: 'Partners', items: [PAGE.centres, PAGE.collegePartners, PAGE.enquiries, PAGE.partnerMap] },
  { label: 'Citizen services', items: [PAGE.services, PAGE.assistance, PAGE.support, PAGE.disputes, PAGE.payments] },
  { label: 'Colleges & careers', items: [PAGE.colleges, PAGE.careers] },
  { label: 'Insights', items: [PAGE.analytics, PAGE.reports, PAGE.audit] },
  { label: 'People & settings', items: [PAGE.users, PAGE.staff, PAGE.notifications, PAGE.scheduled] },
];

/** Support staff: partners. */
export const PARTNERS_NAV: NavGroup[] = [
  { items: [PAGE.centres, PAGE.collegePartners, PAGE.enquiries, PAGE.partnerMap] },
  { label: 'Support', items: [PAGE.assistance, PAGE.support, PAGE.users] },
  { label: 'Records', items: [PAGE.payments, PAGE.reports, PAGE.audit] },
];

/** Support staff: citizen services. */
export const SERVICES_NAV: NavGroup[] = [
  { items: [home(PAGE.services)] },
  { label: 'Support', items: [PAGE.assistance, PAGE.support, PAGE.users] },
  { label: 'Records', items: [PAGE.reports, PAGE.payments, PAGE.audit] },
];

/** Reviewers / editors: jobs, exams, scholarships, admissions. */
export const APPLY_NAV: NavGroup[] = [
  { items: [home(PAGE.review)] },
  {
    label: 'Published',
    items: [
      { href: '/opportunities?type=government_job', label: 'Jobs', icon: <Briefcase /> },
      { href: '/opportunities?type=exam', label: 'Exams', icon: <ClipboardList /> },
      { href: '/opportunities?type=scholarship', label: 'Scholarships', icon: <Award /> },
      { href: '/opportunities?type=admission', label: 'Admissions', icon: <GraduationCap /> },
    ],
  },
  { label: 'Tools', items: [PAGE.scrapers, PAGE.updates, PAGE.analytics, PAGE.audit] },
];

/** Reviewers / editors: colleges and careers. */
export const CAREER_NAV: NavGroup[] = [
  { items: [home(PAGE.colleges)] },
  {
    label: 'Content',
    items: [
      PAGE.careers,
      { href: '/opportunities?type=admission', label: 'Admissions', icon: <GraduationCap /> },
      PAGE.updates,
    ],
  },
  { label: 'Insights', items: [PAGE.analytics, PAGE.audit] },
];

/** Helper to retrieve the appropriate navigation menu for a department */
export function getNavForDepartment(dept: DepartmentType = 'super_admin'): NavGroup[] {
  switch (dept) {
    case 'partners':
      return PARTNERS_NAV;
    case 'services':
      return SERVICES_NAV;
    case 'apply':
      return APPLY_NAV;
    case 'career':
      return CAREER_NAV;
    case 'super_admin':
    default:
      return SUPER_ADMIN_NAV;
  }
}

/** Fallback legacy NAV export for backwards compatibility */
export const NAV: NavGroup[] = SUPER_ADMIN_NAV;

const ALL_DEPARTMENTS: DepartmentType[] = ['super_admin', 'partners', 'services', 'apply', 'career'];

/**
 * Which dashboards a staff member gets, from their DB roles (same mapping as the API's @Roles):
 * super_admin/admin → all · support → Partners + Services · reviewer/content_editor → Apply + Career.
 */
export function departmentsForRoles(roles: readonly string[] = []): DepartmentType[] {
  if (roles.includes('super_admin') || roles.includes('admin')) return ALL_DEPARTMENTS;
  const out: DepartmentType[] = [];
  if (roles.includes('support')) out.push('partners', 'services');
  if (roles.includes('reviewer') || roles.includes('content_editor')) out.push('apply', 'career');
  return out;
}

/** A path is open when it is in the sidebar of one of the user's departments. */
export function canOpenPath(departments: DepartmentType[], pathname: string): boolean {
  if (departments.includes('super_admin')) return true;
  return departments.some((d) =>
    getNavForDepartment(d).some((g) =>
      g.items.some((item) => {
        const base = item.href.split('?')[0];
        return pathname === base || pathname.startsWith(`${base}/`);
      }),
    ),
  );
}

/** The department a path belongs to, preferring the one the user is already in. */
export function departmentForPath(departments: DepartmentType[], pathname: string, current: DepartmentType): DepartmentType {
  const owns = (d: DepartmentType) => canOpenPath([d], pathname) && d !== 'super_admin';
  if (owns(current)) return current;
  return departments.find(owns) ?? (departments.includes('super_admin') ? 'super_admin' : departments[0] ?? current);
}
