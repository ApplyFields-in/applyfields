import { Skeleton } from '@applyfields/ui';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <Skeleton className="h-4 w-72 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
