import { PageHeader } from '@applyfields/ui';
import { LifeBuoy } from 'lucide-react';
import { connection } from 'next/server';
import { SupportClient } from './support-client';

export const metadata = { title: 'Support inbox | ApplyFields Admin' };

export default async function SupportPage() {
  await connection();

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Citizen services"
        title="Support inbox"
        description="Messages citizens send from Help → Contact support. Reply by email, then mark each one resolved."
        icon={<LifeBuoy />}
      />
      <SupportClient />
    </div>
  );
}
