import Pagination from '@components/ui/Pagination'
import SocialMediaFollow from '@components/common/SocialMediaFollow'
import { getSubcategorySlugs } from '@lib/sanity.client'

export async function generateStaticParams() {
  const categories = await getSubcategorySlugs()

  return categories.map((category: { slug: string; parentSlug: string }) => ({
    category: category.parentSlug,
    subcategory: category.slug,
  }))
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { category: string; subcategory: string }
  searchParams: { [key: string]: string }
}) {
  const pageIndex = searchParams.page ? parseInt(searchParams.page) : 1
  // const category = await getCategoryBySlug({ slug: params.category, pageIndex, token })
  const totalPosts = 110
  const totalPages = Math.ceil(totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1
  return (
    <>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            <Pagination
              currentPage={pageIndex}
              totalPosts={totalPosts}
              nextDisabled={nextDisabled}
              prevDisabled={prevDisabled}
              slug={`${params.category}/${params.subcategory}`}
            />
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
