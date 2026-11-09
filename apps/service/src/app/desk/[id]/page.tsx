import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LiveWorkstation } from './workstation-client';

export const metadata: Metadata = {
  title: 'Service Workstation | ApplyFields Services Hub',
  description: 'Application filing workstation, candidate biodata vault, and government portal assistant.',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function WorkstationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // A real service request: loaded in the browser with the operator's session.
  if (!UUID.test(id)) notFound();
  return <LiveWorkstation id={id} />;
}
