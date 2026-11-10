import { PageHeader } from '@applyfields/ui';
import { Clock } from 'lucide-react';
import { connection } from 'next/server';
import { ScheduledTasksClient } from './scheduled-tasks-client';

export const metadata = { title: 'Background jobs | ApplyFields Admin' };

export default async function ScheduledTasksPage() {
  await connection();

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="System"
        title="Background jobs"
        description="What the API does on its own: closing expired listings, sending reminders, running scrapers and checking official links. Each card shows its recent runs."
        icon={<Clock />}
      />

      <ScheduledTasksClient />
    </div>
  );
}

