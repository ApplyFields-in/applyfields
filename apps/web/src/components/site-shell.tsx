import type { ApiHealth } from '@applyfields/types';
import { buttonClass, Shell, Sidebar } from '@applyfields/ui';
import { Bell, Crown, Search, ShieldCheck, Sparkles, Store } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { apiGet, API_URL } from '@/lib/api';
import { NAV } from '@/lib/nav';
import { TopNavAuth } from '@/components/top-nav-auth';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <Shell sidebar={<Sidebar groups={NAV} subtitle="Citizen & student portal" footer={<SidebarFooter />} />} topbar={<Topbar />} footer={<Footer />}>
      {children}
    </Shell>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-2">
      <div className="rounded-2xl bg-cream/10 p-4">
        <Crown className="size-5 text-celadon" aria-hidden="true" />
        <p className="mt-2 text-sm font-bold">ApplyFields Plus</p>
        <p className="text-xs text-cream/75">Optional plan · about ₹50/month. Core features stay free.</p>
        <Link href="/account" className={buttonClass({ variant: 'inverse', size: 'sm', className: 'mt-3 w-full' })}>
          See benefits
        </Link>
      </div>
      <Link href="/partner" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-cream/85 hover:bg-cream/10">
        <Store className="size-4" aria-hidden="true" /> For partners & institutions
      </Link>
    </div>
  );
}

function Topbar() {
  return (
    <>
      <form action="/search" role="search" className="relative hidden max-w-xl flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/80" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search ApplyFields"
          placeholder="Search jobs, exams, scholarships, services…"
          className="h-10 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm placeholder:text-teal/80"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/search" aria-label="Search" className="grid size-10 place-items-center rounded-full border border-line bg-cream sm:hidden">
          <Search className="size-4" />
        </Link>
        <Link
          href="/career/guidance"
          className="hidden h-10 items-center gap-2 rounded-full border border-sea/40 bg-cream px-4 text-sm font-semibold md:inline-flex"
        >
          <Sparkles className="size-4 text-sea" aria-hidden="true" /> Ask AI
        </Link>
        <Link href="/notifications" aria-label="Notifications" className="relative grid size-10 place-items-center rounded-full border border-line bg-cream">
          <Bell className="size-4" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-sea" aria-hidden="true" />
        </Link>
        <TopNavAuth />
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-line px-4 py-5 text-xs text-teal/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <p className="flex items-start gap-2">
        <ShieldCheck className="size-4 shrink-0 text-sea" aria-hidden="true" />
        ApplyFields is not a government website. Always apply through the official link shown on each page.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <ApiStatus />
        <Link href="/help" className="hover:underline">Help</Link>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <Link href="/terms" className="hover:underline">Terms</Link>
      </div>
    </footer>
  );
}

/** Proves the website ↔ API connection: shows whether the NestJS API answers. */
async function ApiStatus() {
  await connection();
  const health = await apiGet<ApiHealth>('/health');
  return (
    <span
      title={API_URL}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 font-semibold text-teal"
    >
      <span className={`size-2 rounded-full ${health ? 'bg-sea' : 'bg-teal/30'}`} aria-hidden="true" />
      {health ? 'API connected' : 'API offline'}
    </span>
  );
}
