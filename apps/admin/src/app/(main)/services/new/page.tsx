import { ServiceForm } from '@/components/service-form';

export const metadata = { title: 'New Service' };

export default function NewServicePage() {
  return <ServiceForm mode="create" />;
}
