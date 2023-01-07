import { notFound } from 'next/navigation'

import { CategoryHeader, ArticleList } from '@components/ui'
import { SocialMediaFollow } from '@components/common'
import {
  getAllSubCategorySlugs,
  getSubCategoryInfoBySlug,
  getConferencePosts,
} from '@lib/sanity.client'

export async function generateStaticParams() {
  return await getAllSubCategorySlugs()
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  const data = await getSubCategoryInfoBySlug(slug)
  const { posts, totalPosts } = await getConferencePosts(slug, 1)
  const totalPages = Math.ceil(totalPosts / 10)

  if (!data) {
    notFound()
  }

  const { parentSlug, parentTitle, title } = data
  const path = `fcs/${slug}`

  const breadCrumbPages = [
    {
      name: parentTitle!,
      href: `/${parentSlug!}`,
    },
    {
      name: title!,
      href: `/${parentSlug!}/${slug}`,
    },
  ]

  return (
    <>
      <CategoryHeader
        title={`Latest ${title} Football News`}
        aboveTitle="Football Championship Subdivision"
        breadCrumbPages={breadCrumbPages}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            {posts && (
              <ArticleList
                articles={posts}
                totalPages={totalPages}
                totalPosts={totalPosts}
                currentPage={'1'}
                path={path}
              />
            )}
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
