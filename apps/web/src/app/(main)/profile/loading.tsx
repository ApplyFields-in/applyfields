import { Skeleton } from '@applyfields/ui';

/** Profile skeleton — matches the profile page header + tabs + form layout */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Profile header card */}
      <div className="rounded-3xl border-2 border-line/40 bg-cream p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-36 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-20 w-48 rounded-2xl hidden sm:block" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-line/40">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
      {/* Tab bar */}
      <Skeleton className="h-12 rounded-2xl" />
      {/* Form card */}
      <div className="rounded-3xl border-2 border-line/40 bg-cream p-6 sm:p-8 space-y-5">
        <Skeleton className="h-6 w-44 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}
