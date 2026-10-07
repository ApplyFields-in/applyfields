import { Skeleton } from '@applyfields/ui';

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-44 rounded-lg" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}
