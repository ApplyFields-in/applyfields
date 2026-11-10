import { PageHeader } from '@applyfields/ui';
import { CreditCard } from 'lucide-react';
import { connection } from 'next/server';
import { PaymentsClient } from './payments-client';

export const metadata = { title: 'Payments | ApplyFields Admin' };

export default async function Page() {
  await connection();
  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Operations"
        title="Payments"
        description="Money that exists today: what citizens paid at centres, partner payouts, and online payments once Razorpay is connected."
        icon={<CreditCard />}
      />
      <PaymentsClient />
    </div>
  );
}
