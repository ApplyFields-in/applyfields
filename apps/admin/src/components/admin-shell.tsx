import type { ApiHealth } from '@applyfields/types';
import { Badge, buttonClass, Card, Shell, Sidebar } from '@applyfields/ui';
import { LogIn, Search, ShieldCheck, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { API_URL, apiGet } from '@/lib/api';
import { NAV } from '@/lib/nav';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Shell sidebar={<Sidebar groups={NAV} subtitle="Internal Portal" footer={<SidebarFooter />} />} topbar={<Topbar />} footer={<Footer />}>
      {children}
    </Shell>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-cream/10 p-3 text-xs text-cream/85">
      <ShieldCheck className="size-4 shrink-0 text-celadon" aria-hidden="true" />
      Staff only. Every action here is recorded in the audit log.
    </div>
  );
}

function Topbar() {
  return (
    <>
      <form action="/opportunities" role="search" className="relative hidden max-w-xl flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/80" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search the portal"
          placeholder="Search opportunities, users, partners…"
          className="h-10 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm placeholder:text-teal/80"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Badge tone="celadon" className="hidden md:inline-flex">
          Internal Portal
        </Badge>
        <Link href="/login" className={buttonClass()}>
          <LogIn aria-hidden="true" /> Staff log in
        </Link>
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-line px-4 py-5 text-xs text-teal/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <p>ApplyFields Internal Portal · for the ApplyFields team only</p>
      <ApiStatus />
    </footer>
  );
}

async function ApiStatus() {
  await connection();
  const health = await apiGet<ApiHealth>('/health');
  return (
    <span title={API_URL} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 font-semibold text-teal">
      <span className={`size-2 rounded-full ${health ? 'bg-sea' : 'bg-teal/30'}`} aria-hidden="true" />
      {health ? 'API connected' : 'API offline'}
    </span>
  );
}

export function ApiOffline() {
  return (
    <Card tone="tea" className="flex items-start gap-3 p-5">
      <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">Can’t reach the API</p>
        <p className="mt-1 text-sm">
          This portal reads from <code className="font-mono">{API_URL}</code>. Start it with{' '}
          <code className="font-mono font-semibold">pnpm dev:api</code>.
        </p>
      </div>
    </Card>
  );
}
