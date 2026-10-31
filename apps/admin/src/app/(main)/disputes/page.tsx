import { PageHeader } from '@applyfields/ui';
import { Scale } from 'lucide-react';
import { connection } from 'next/server';
import { DisputesClient } from './disputes-client';

export const metadata = { title: 'Disputes & Refund Arbitration Desk | ApplyFields Admin' };

export default async function DisputesPage() {
  await connection();

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Consumer Protection & Governance"
        title="Disputes & Refund Arbitration Desk"
        description="Review citizen grievances regarding partner kiosk overcharging, service delays, or filing defects. Execute binding escrow debits, process refunds, and safeguard platform trust."
        icon={<Scale />}
      />

      <DisputesClient />
    </div>
  );
}

