import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

export default function Index() {
  const { status } = useSession();
  if (status === 'staff') return <Redirect href="/home" />;
  if (status === 'signed_out') return <Redirect href="/login" />;
  return null;
}
