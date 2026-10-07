import { Skeleton } from '@applyfields/ui';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
