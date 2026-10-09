import { buttonClass, Shell, Sidebar } from '@applyfields/ui';
import { Bell, Crown, Search, ShieldCheck, Sparkles, Store } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { NAV } from '@/lib/nav';
import { TopNavAuth } from '@/components/top-nav-auth';
import { PasskeyEnrollModal } from '@/components/passkey-enroll-modal';
import { ApiStatus } from '@/components/api-status';
import { NotificationBellDot } from '@/components/notification-center';
import { SearchBox } from '@/components/search-box';

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <Shell sidebar={<Sidebar groups={NAV} subtitle="Citizen & student portal" footer={<SidebarFooter />} />} topbar={<Topbar />} footer={<Footer />}>
      {children}
      <PasskeyEnrollModal />
    </Shell>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-cream/10 p-4 shadow-clay">
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
      <SearchBox />
      <div className="ml-auto flex items-center gap-2">
        <Link href="/search" aria-label="Search" className="clay-press grid size-10 place-items-center rounded-full bg-cream shadow-clay sm:hidden">
          <Search className="size-4" />
        </Link>
        <Link
          href="/career/guidance"
          className="clay-press hidden h-10 items-center gap-2 rounded-full bg-cream px-4 text-sm font-semibold shadow-clay md:inline-flex"
        >
          <Sparkles className="size-4 text-sea" aria-hidden="true" /> Ask AI
        </Link>
        <Link href="/notifications" aria-label="Notifications" className="clay-press relative grid size-10 place-items-center rounded-full bg-cream shadow-clay">
          <Bell className="size-4" />
          <NotificationBellDot />
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

