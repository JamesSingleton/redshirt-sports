import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="container">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="mt-8 h-10 w-3/4 rounded" />
            <Skeleton className="mt-2 h-6 w-3/4 rounded" />
          </div>
        </div>
      </section>
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[205px] w-[411px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[205px] w-[411px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[205px] w-[411px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
