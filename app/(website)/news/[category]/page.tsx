import { getCategoryBySlug, getParentCategorySlugs } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import SocialMediaFollow from '@components/common/SocialMediaFollow'
import HorizontalCard from '@components/ui/HorizontalCard'
import Pagination from '@components/ui/Pagination'

import type { Metadata, ResolvingMetadata } from 'next'
import type { Post } from '@types'

type Props = {
  params: { category: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent?: ResolvingMetadata
): Promise<Metadata> {
  const page = searchParams.page
  const token = getPreviewToken()
  const pageIndex = page ? parseInt(page.toString()) : 1
  const category = await getCategoryBySlug({ slug: params.category, pageIndex, token })
  return {
    title: `${category?.pageHeader}, Rumors, and More`,
    description: category?.description,
  }
}

export async function generateStaticParams() {
  const categories = await getParentCategorySlugs()
  return categories.map((category: { slug: string }) => ({
    category: category.slug,
  }))
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { [key: string]: string }
}) {
  const { page } = searchParams
  const token = getPreviewToken()
  const pageIndex = page ? parseInt(page) : 1
  const category = await getCategoryBySlug({ slug: params.category, pageIndex, token })
  const totalPages = Math.ceil(category?.totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  return (
    <>
      <section className="bg-slate-50 py-12 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
              <div className="mt-6 text-center md:mt-0 md:text-left">
                {category?.pageHeader && (
                  <span className="block text-xs uppercase tracking-widest text-brand-500">
                    {category?.subTitle}
                  </span>
                )}
                <h1 className="mt-1 font-cal text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-wider lg:text-5xl lg:leading-tight">
                  {category?.pageHeader}
                </h1>
              </div>
            </div>
            <div className="order-1 md:order-2">Breadcrumbs Here</div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            {category.posts.map((post: Post) => (
              <HorizontalCard {...post} key={post._id} />
            ))}
            <Pagination
              currentPage={pageIndex}
              totalPosts={category.totalPosts}
              nextDisabled={nextDisabled}
              prevDisabled={prevDisabled}
              slug={`news/${params.category}`}
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
