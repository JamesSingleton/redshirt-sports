import { CameraIcon } from 'lucide-react'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'

export default function ArticlePageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Section */}
      <section className="mt-8 pb-8">
        <div className="container">
          {/* Title skeleton */}
          <Skeleton className="mb-4 h-12 w-4/5 sm:h-16 lg:h-20 xl:h-24" />

          {/* Excerpt skeleton */}
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-full lg:h-7" />
            <Skeleton className="h-6 w-3/4 lg:h-7" />
          </div>

          {/* Badges and date skeleton */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <span className="text-sm">•</span>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-20 xl:gap-24">
            {/* Desktop Sidebar */}
            <div className="lg:w-64 lg:shrink-0">
              <div className="hidden lg:sticky lg:top-24 lg:left-0 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:self-start">
                <p className="text-muted-foreground text-sm font-normal">Written By</p>

                {/* Author info skeleton */}
                <div className="flex min-h-10 flex-row items-center justify-start gap-3 p-0">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-col items-stretch justify-start gap-0.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>

                {/* Share card skeleton */}
                <Card className="mt-8 hidden w-full lg:block">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-20" />
                      </div>
                    </div>
                    <div className="flex justify-start gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile author section */}
              <div className="lg:hidden">
                <p className="text-muted-foreground text-sm font-normal">Written By</p>
                <div className="border-border relative -mx-6 mt-3 flex overflow-x-auto border-b px-6">
                  <div className="flex-1 pb-4">
                    <div className="flex flex-row items-stretch justify-start gap-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <article className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              {/* Main image skeleton */}
              <figure className="mb-8 space-y-1.5">
                <Skeleton className="h-64 w-full rounded-lg sm:h-80 lg:h-96" />
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CameraIcon className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </figure>

              {/* Article content skeleton */}
              <div className="space-y-6">
                {/* First paragraph */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>

                {/* Subheading */}
                <Skeleton className="mt-8 h-8 w-2/3" />

                {/* Second paragraph */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Quote block */}
                <div className="border-muted my-6 space-y-2 border-l-4 pl-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>

                {/* Third paragraph */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                {/* List items */}
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Final paragraphs */}
                <div className="mt-8 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Related Posts Section */}
      <section className="border-border border-y py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-8 w-64 sm:h-10 lg:h-12" />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <span>•</span>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loading indicator */}
      <div className="fixed right-8 bottom-8 z-50">
        <div className="bg-background border-border rounded-lg border px-4 py-2 shadow-lg">
          <div className="text-muted-foreground flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading article...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
