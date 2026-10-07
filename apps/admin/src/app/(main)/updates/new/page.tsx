import { UpdateForm } from '@/components/updates-ui';

export const metadata = { title: 'New notice / update' };

export default function NewUpdatePage() {
  return (
    <div className="mx-auto max-w-4xl py-2">
      <UpdateForm initialData={null} mode="create" />
    </div>
  );
}
