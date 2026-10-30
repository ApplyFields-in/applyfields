import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { TrajectoriesClient } from './trajectories-client';

export const metadata = {
  title: 'Career Trajectories & Curriculum Overlap Analyzer | ApplyFields',
  description:
    'Interactive preparation milestone tracker and cross-exam curriculum overlap analyzer for UPSC, SSC, State PSC, and Banking.',
};

export default function TrajectoriesPage() {
  return (
    <div className="bg-[#F2F1ED] min-h-screen py-8 sm:py-10">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Career', href: '/career' },
            { label: 'Trajectories & Overlap Analyzer' },
          ]}
        />
        <TrajectoriesClient />
      </div>
    </div>
  );
}

