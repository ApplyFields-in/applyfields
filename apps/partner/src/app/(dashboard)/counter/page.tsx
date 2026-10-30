import { Metadata } from 'next';
import { CounterClient } from './counter-client';

export const metadata: Metadata = {
  title: 'Walk-In Counter POS | Partner Desk',
  description: 'Physical walk-in citizen registration, instant fee quoting, and counter queue token issuing.',
};

export default function CounterPage() {
  return <CounterClient />;
}

