import { Metadata } from 'next';
import { OperatorQueueClient } from './operator-queue-client';

export const metadata: Metadata = {
  title: 'Filing Desk | ApplyFields Services Hub',
  description: 'Where partner centres apply on government portals for citizens.',
};

export default function OperatorDeskPage() {
  return <OperatorQueueClient />;
}

