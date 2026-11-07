import { Metadata } from 'next';
import { SAMPLE_SERVICE_REQUESTS } from '@/lib/service-desk-data';
import { LiveWorkstation, WorkstationClient } from './workstation-client';

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
  const sample = SAMPLE_SERVICE_REQUESTS.find((r) => r.id === id);
  if (sample) return <WorkstationClient initialRequest={sample} />;

  // A real service request: loaded in the browser with the operator's session.
  if (UUID.test(id)) return <LiveWorkstation id={id} />;

  // Unknown demo id: show the first sample so the demo never 404s.
  return <WorkstationClient initialRequest={{ ...SAMPLE_SERVICE_REQUESTS[0], id }} />;
}
