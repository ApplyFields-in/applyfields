/** The landing route: send the partner to wherever their session allows. */
import { Redirect, type Href } from 'expo-router';

import { useSession, type SessionStatus } from '@/lib/session';

const HOME: Record<Exclude<SessionStatus, 'loading' | 'offline'>, Href> = {
  signed_out: '/login',
  no_partner: '/onboard',
  pending: '/under-review',
  rejected: '/under-review',
  centre: '/home',
  institution: '/desk',
};

export default function Index() {
  const { status } = useSession();
  if (status === 'loading' || status === 'offline') return null;
  return <Redirect href={HOME[status]} />;
}
