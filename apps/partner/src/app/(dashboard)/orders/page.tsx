import { Metadata } from 'next';
import { OrdersClient } from './orders-client';

export const metadata: Metadata = {
  title: 'Orders Pipeline & OTP Relay | Partner Desk',
  description: 'Real-time application pipeline tracking, citizen OTP relay, and official A4 receipt printing.',
};

export default function OrdersPage() {
  return <OrdersClient />;
}
