import { PageHeader } from '@applyfields/ui';
import { Settings } from 'lucide-react';
import { connection } from 'next/server';
import { SECTIONS } from '@/lib/sections';
import { SettingsClient } from './settings-client';

export const metadata = { title: SECTIONS.settings.title };

export default async function SettingsPage() {
  await connection();

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Platform Governance &amp; Administration"
        title="Settings &amp; Security Policy"
        description="Configure mandatory 2FA enforcement, departmental role isolation boundaries, scraper concurrency limits, and compliance audit snapshot retention."
        icon={<Settings />}
      />
      <SettingsClient />
    </div>
  );
}
