import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SAMPLE_SERVICE_REQUESTS } from '@/lib/service-desk-data';
import { WorkstationClient } from './workstation-client';

export const metadata: Metadata = {
  title: 'Service Workstation | ApplyFields Services Hub',
  description: 'Application filing workstation, candidate biodata vault, and government portal assistant.',
};

export default async function WorkstationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = SAMPLE_SERVICE_REQUESTS.find((r) => r.id === id);

  if (!request) {
    // If not in sample list, fallback to first sample to avoid 404 in demo
    const fallback = SAMPLE_SERVICE_REQUESTS[0];
    return <WorkstationClient initialRequest={{ ...fallback, id }} />;
  }

  return <WorkstationClient initialRequest={request} />;
}

