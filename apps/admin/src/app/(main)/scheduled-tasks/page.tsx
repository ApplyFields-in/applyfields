import { PageHeader } from '@applyfields/ui';
import { Clock } from 'lucide-react';
import { connection } from 'next/server';
import { ScheduledTasksClient } from './scheduled-tasks-client';

export const metadata = { title: 'Scheduled Tasks & Background Cron | ApplyFields Admin' };

export default async function ScheduledTasksPage() {
  await connection();

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Background Infrastructure & Automation"
        title="Scheduled Tasks & Background Cron Engine"
        description="Monitor automated deadline reminder dispatchers (7d, 3d, 24h horizons), 12-hour candidate digests, web scraper sync heartbeats, and queue health. Trigger manual job executions with one click."
        icon={<Clock />}
      />

      <ScheduledTasksClient />
    </div>
  );
}

