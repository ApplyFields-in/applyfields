import { Skeleton } from '@applyfields/ui';

/** Home dashboard skeleton — shown while /home API data loads */
export default function HomeLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-6">
        {/* Hero search */}
        <Skeleton className="h-36 rounded-3xl" />
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        {/* Closing soon + updates */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="lg:col-span-3 h-56 rounded-3xl" />
          <Skeleton className="lg:col-span-2 h-56 rounded-3xl" />
        </div>
        {/* Popular cards */}
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
      {/* Sidebar */}
      <aside className="space-y-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </aside>
    </div>
  );
}
