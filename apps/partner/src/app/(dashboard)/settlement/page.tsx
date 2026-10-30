import { Metadata } from 'next';
import { SettlementClient } from './settlement-client';

export const metadata: Metadata = {
  title: 'Cash Drawer & Commission Settlement | Partner Desk',
  description: 'Daily counter cash drawer reconciliation, 70% commission wallet, and instant bank disbursement ledger.',
};

export default function SettlementPage() {
  return <SettlementClient />;
}

