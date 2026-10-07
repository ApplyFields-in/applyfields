import { Skeleton } from '@applyfields/ui';

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-36 rounded-lg" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}
