import type { NavGroup } from '@applyfields/ui';
import {
  Award,
  Bell,
  Briefcase,
  Building,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  CreditCard,
  Crown,
  FileCheck2,
  FileText,
  Flag,
  GraduationCap,
  HandHelping,
  Inbox,
  Landmark,
  Layers,
  LayoutDashboard,
  Megaphone,
  Radar,
  Scale,
  ScrollText,
  Settings,
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
    name: 'Super Administration',
    shortLabel: 'Master Cockpit',
    badge: 'Root Access',
    description: 'Central platform command, cross-department governance, and audit ledger.',
    homePath: '/',
  },
  partners: {
    id: 'partners',
    name: 'Partners & Franchise Network',
    shortLabel: 'Partners',
    badge: 'Franchise Ops',
    description: 'Partner center onboarding, KYC compliance, center slots, and payout ledger.',
    homePath: '/partners',
  },
  services: {
    id: 'services',
    name: 'Citizen Services & Assistance',
    shortLabel: 'Citizen Services',
    badge: 'Services Ops',
    description: 'Government service delivery, document verification, and MeeSeva center handoffs.',
    homePath: '/services',
  },
  apply: {
    id: 'apply',
    name: 'Apply & Opportunities Engine',
    shortLabel: 'Apply & Ingestion',
    badge: 'Review & Content',
    description: 'Ingestion review queue, scraper pipelines, and official notification publishing.',
    homePath: '/review',
  },
  career: {
    id: 'career',
    name: 'Career & Higher Education',
    shortLabel: 'Career & Colleges',
    badge: 'Higher Ed Ops',
    description: 'Top 50 Medical and Engineering colleges, cutoff benchmarks, and roadmaps.',
    homePath: '/colleges',
  },
};

/** Department 1: Super Admin Navigation (Master Cockpit) */
export const SUPER_ADMIN_NAV: NavGroup[] = [
  { items: [{ href: '/', label: 'Master Cockpit', icon: <LayoutDashboard />, exact: true }] },
  {
    label: 'Opportunities & Apply',
    items: [
      { href: '/review', label: 'Review Queue', icon: <Inbox /> },
      { href: '/opportunities', label: 'All Opportunities', icon: <Briefcase /> },
      { href: '/scrapers', label: 'Scrapers Pipeline', icon: <Radar /> },
      { href: '/updates', label: 'Announcements', icon: <Megaphone /> },
    ],
  },
  {
    label: 'Citizen Services & Partners',
    items: [
      { href: '/services', label: 'Services Catalog', icon: <Landmark /> },
      { href: '/partners', label: 'Partner Centers', icon: <Store /> },
      { href: '/assistance', label: 'Assistance Network', icon: <HandHelping /> },
    ],
  },
  {
    label: 'Career & Colleges',
    items: [
      { href: '/colleges', label: 'Colleges Directory', icon: <Building /> },
      { href: '/careers', label: 'Career Trajectories', icon: <Compass /> },
    ],
  },
  {
    label: 'Governance & Audits',
    items: [
      { href: '/users', label: 'User Directory', icon: <Users /> },
      { href: '/analytics', label: 'Funnel Analytics', icon: <TrendingUp /> },
      { href: '/reports', label: 'Operational Reports', icon: <Flag /> },
      { href: '/disputes', label: 'Disputes & Refunds', icon: <Scale /> },
      { href: '/scheduled-tasks', label: 'Scheduled Tasks & Cron', icon: <Clock /> },
      { href: '/payments', label: 'Financial Ledger', icon: <CreditCard /> },
      { href: '/audit', label: 'Audit Trail', icon: <ScrollText /> },
      { href: '/settings', label: 'Staff Roles & Config', icon: <Settings /> },
    ],
  },
];

/** Department 2: Partners & Franchise Network Navigation */
export const PARTNERS_NAV: NavGroup[] = [
  { items: [{ href: '/partners', label: 'Partners Cockpit', icon: <Store />, exact: true }] },
  {
    label: 'Center Operations',
    items: [
      { href: '/assistance', label: 'Assistance Network', icon: <HandHelping /> },
      { href: '/users', label: 'Partner Agents & Staff', icon: <Users /> },
    ],
  },
  {
    label: 'Financials & Compliance',
    items: [
      { href: '/payments', label: 'Commission & Payouts', icon: <CreditCard /> },
      { href: '/reports', label: 'Performance Reports', icon: <Flag /> },
      { href: '/audit', label: 'Partner Activity Log', icon: <ScrollText /> },
    ],
  },
];

/** Department 3: Citizen Services & Assistance Navigation */
export const SERVICES_NAV: NavGroup[] = [
  { items: [{ href: '/services', label: 'Services Cockpit', icon: <Landmark />, exact: true }] },
  {
    label: 'Fulfillment & Cases',
    items: [
      { href: '/assistance', label: 'Citizen Inquiries & Cases', icon: <HandHelping /> },
      { href: '/users', label: 'Applicant Profiles', icon: <Users /> },
    ],
  },
  {
    label: 'Monitoring & SLA',
    items: [
      { href: '/reports', label: 'SLA Resolution Reports', icon: <Flag /> },
      { href: '/payments', label: 'Citizen Service Fees', icon: <CreditCard /> },
      { href: '/audit', label: 'Case Audit Trail', icon: <ScrollText /> },
    ],
  },
];

/** Department 4: Apply & Opportunities Pipeline Navigation */
export const APPLY_NAV: NavGroup[] = [
  { items: [{ href: '/review', label: 'Ingestion Review Queue', icon: <Inbox />, exact: true }] },
  {
    label: 'Live Inventory',
    items: [
      { href: '/opportunities?type=government_job', label: 'Government Jobs', icon: <Briefcase /> },
      { href: '/opportunities?type=exam', label: 'Entrance Exams', icon: <ClipboardList /> },
      { href: '/opportunities?type=scholarship', label: 'Scholarships', icon: <Award /> },
      { href: '/opportunities?type=admission', label: 'Admissions', icon: <GraduationCap /> },
    ],
  },
  {
    label: 'Automation & Publishing',
    items: [
      { href: '/scrapers', label: 'Scrapers & Ingestion', icon: <Radar /> },
      { href: '/updates', label: 'Notification Broadcasts', icon: <Megaphone /> },
      { href: '/analytics', label: 'Application Trends', icon: <TrendingUp /> },
      { href: '/audit', label: 'Publishing Audit Log', icon: <ScrollText /> },
    ],
  },
];

/** Department 5: Career & Higher Education Navigation */
export const CAREER_NAV: NavGroup[] = [
  { items: [{ href: '/colleges', label: 'Colleges Directory', icon: <Building />, exact: true }] },
  {
    label: 'Academic Curation',
    items: [
      { href: '/careers', label: 'Degree Programs & Paths', icon: <Compass /> },
      { href: '/opportunities?type=admission', label: 'College Admissions', icon: <GraduationCap /> },
      { href: '/updates', label: 'Cutoff Announcements', icon: <Megaphone /> },
    ],
  },
  {
    label: 'Metrics & Oversight',
    items: [
      { href: '/analytics', label: 'Student Search Trends', icon: <TrendingUp /> },
      { href: '/audit', label: 'Curation Change Log', icon: <ScrollText /> },
    ],
  },
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
