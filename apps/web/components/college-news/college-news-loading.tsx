import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

const ARTICLE_ROW_COUNT = 8;

export function CollegeNewsArticleListLoading() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: ARTICLE_ROW_COUNT }).map((_, index) => (
        <div
          key={`article-row-skeleton-${index.toString()}`}
          className="flex gap-4 py-4 first:pt-0"
        >
          <Skeleton className="h-20 w-[120px] shrink-0 rounded sm:h-[100px] sm:w-40" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface CollegeNewsLoadingProps {
  showSidebar?: boolean;
  showConferenceFilter?: boolean;
  showDivisionNav?: boolean;
}

export function CollegeNewsLoading({
  showSidebar = true,
  showConferenceFilter = false,
  showDivisionNav = true,
}: CollegeNewsLoadingProps) {
  return (
    <div className="container px-4 py-6">
      <div className="mb-6 space-y-2 border-border border-b pb-3">
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-5/6 max-w-xl" />
          </div>

          {showConferenceFilter ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-52 rounded-md" />
            </div>
          ) : null}

          <CollegeNewsArticleListLoading />
        </div>

        {showSidebar ? (
          <aside className="space-y-6 lg:col-span-4">
            <Skeleton className="h-[250px] w-full rounded-lg" />
            {showDivisionNav ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <Skeleton className="h-12 w-full" />
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    key={`sidebar-row-skeleton-${index.toString()}`}
                    className="h-11 w-full border-border border-t"
                  />
                ))}
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
