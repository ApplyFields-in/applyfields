import { Metadata } from 'next';
import { SettlementClient } from './settlement-client';

export const metadata: Metadata = {
  title: 'Earnings & Settlements | Partner Desk',
  description: 'Completed services, earnings, and payouts from ApplyFields.',
};

export default function SettlementPage() {
  return <SettlementClient />;
}

