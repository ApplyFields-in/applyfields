import { PageHeader } from '@applyfields/ui';
import { Scale } from 'lucide-react';
import { connection } from 'next/server';
import { DisputesClient } from './disputes-client';

export const metadata = { title: 'Booking disputes | ApplyFields Admin' };

export default async function DisputesPage() {
  await connection();

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Partners & Services"
        title="Booking disputes"
        description="Complaints citizens raise about a centre booking: overcharging, delays, wrong details. Review each one and send the citizen your decision."
        icon={<Scale />}
      />

      <DisputesClient />
    </div>
  );
}

