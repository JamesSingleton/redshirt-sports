import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

function MegaboardSkeleton() {
  return (
    <div className="py-4">
      <div className="container px-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <Skeleton className="aspect-video w-full rounded-lg lg:aspect-auto lg:min-h-[320px] lg:flex-7" />
          <div className="flex min-h-0 flex-col gap-3 lg:flex-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-0 flex-1 gap-4 rounded-lg bg-card p-3 shadow"
              >
                <Skeleton className="min-h-20 w-32 shrink-0 self-stretch rounded-md sm:min-h-24 sm:w-36" />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeaderSkeleton({ withBadge = false }: { withBadge?: boolean }) {
  return (
    <div className="mb-4 flex items-center justify-between border-primary border-b-2 pb-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-40" />
        {withBadge ? <Skeleton className="h-5 w-10 rounded" /> : null}
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

function MediumArticleCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-4/3 w-full rounded-lg sm:aspect-video" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function SectionSkeleton({
  columns = 2,
  withBadge = false,
  withDescription = false,
}: {
  columns?: 2 | 3;
  withBadge?: boolean;
  withDescription?: boolean;
}) {
  return (
    <section className="mb-8">
      <SectionHeaderSkeleton withBadge={withBadge} />
      {withDescription ? (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : null}
      <div
        className={
          columns === 3
            ? "grid grid-cols-1 gap-6 md:grid-cols-3"
            : "grid grid-cols-1 gap-6 md:grid-cols-2"
        }
      >
        {Array.from({ length: columns }, (_, index) => (
          <MediumArticleCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function Top25WidgetSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2 border-border border-b pb-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 py-1">
            <Skeleton className="h-4 w-5" />
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OurTeamWidgetSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="space-y-3 p-6">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-border border-t px-4 py-3 first:border-t-0 first:pt-0"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterWidgetSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-none">
      <div className="space-y-3 p-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <Top25WidgetSkeleton />
      <OurTeamWidgetSkeleton />
      <NewsletterWidgetSkeleton />
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </div>
  );
}

export default function HomePageSkeleton() {
  return (
    <>
      <p className="sr-only">Loading homepage...</p>
      <MegaboardSkeleton />
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <SectionSkeleton />
            <SectionSkeleton columns={3} withBadge />
            <SectionSkeleton />
            <SectionSkeleton withDescription />
            <SectionSkeleton columns={3} withDescription />
          </div>
          <aside className="space-y-6 lg:col-span-4">
            <SidebarSkeleton />
          </aside>
        </div>
      </div>
    </>
  );
}
