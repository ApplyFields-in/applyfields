import { Skeleton } from '@applyfields/ui';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52 rounded-lg" />
      <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
      <Skeleton className="h-48 rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}
