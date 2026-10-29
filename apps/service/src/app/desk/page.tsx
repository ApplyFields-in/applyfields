import { Metadata } from 'next';
import { OperatorQueueClient } from './operator-queue-client';

export const metadata: Metadata = {
  title: 'Operator Fulfillment Desk | ApplyFields Services Hub',
  description: 'Certified back-office workstation for recruitment and citizen service portal filings.',
};

export default function OperatorDeskPage() {
  return <OperatorQueueClient />;
}
