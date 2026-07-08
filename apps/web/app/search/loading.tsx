import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

import { CollegeNewsArticleListLoading } from "@/components/college-news/college-news-loading";

export default function Loading() {
  return (
    <div className="container px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-6 border-border border-b pb-3">
        <Skeleton className="h-4 w-40" />
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <header className="space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="mt-4 h-10 w-full max-w-xl rounded-md" />
          </header>

          <CollegeNewsArticleListLoading />
        </div>

        <aside className="lg:col-span-4">
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </aside>
      </div>
    </div>
  );
}
