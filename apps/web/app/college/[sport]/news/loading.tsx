import { Skeleton } from '@workspace/ui/components/skeleton'

import { LoadingArticle } from '@/components/loading-article'

export default function Loading() {
  return (
    <>
      <section className="py-12">
        <div className="container">
          <div className="md:max-w-3xl xl:max-w-5xl">
            {/* <Skeleton className="h-6 w-60" /> */}
            <Skeleton className="mt-8 h-10 w-3/4 rounded" />
            <Skeleton className="mt-2 h-6 w-3/4 rounded" />
          </div>
        </div>
      </section>
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          <LoadingArticle />
          <LoadingArticle />
          <LoadingArticle />
          <LoadingArticle />
        </div>
      </section>
    </>
  )
}
