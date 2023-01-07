import { SocialMediaFollow } from '@components/common'
import { CategoryHeader, ArticleList } from '@components/ui'
import { getConferencePosts, getSubCategoryInfoBySlug } from '@lib/sanity.client'

export default async function Page({ params }: { params: any }) {
  const { slug, page } = params
  const { posts, totalPosts } = await getConferencePosts(slug, parseInt(page, 10))
  const data = await getSubCategoryInfoBySlug(slug)
  const totalPages = Math.ceil(totalPosts / 10)

  const { parentSlug, parentTitle, title } = data
  const path = `${parentSlug}/${slug}`

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
            <ArticleList
              articles={posts}
              totalPages={totalPages}
              totalPosts={totalPosts}
              currentPage={page}
              path={path}
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
