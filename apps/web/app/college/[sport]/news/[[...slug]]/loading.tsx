import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

import { LoadingArticle } from "@/components/loading-article";

export function NewsFeedLoading() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <LoadingArticle />
      <LoadingArticle />
      <LoadingArticle />
      <LoadingArticle />
    </div>
  );
}

export function NewsPageLoading() {
  return (
    <>
      <section className="py-12">
        <div className="container">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Skeleton className="mt-8 h-10 w-3/4 rounded" />
            <Skeleton className="mt-2 h-6 w-3/4 rounded" />
          </div>
        </div>
      </section>
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <NewsFeedLoading />
      </section>
    </>
  );
}

export default NewsPageLoading;
