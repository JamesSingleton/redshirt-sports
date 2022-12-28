import { CategoryHeader, ArticleList } from '@components/ui'
import { SocialMediaFollow } from '@components/common'
import { getSubdivisionPosts } from '@lib/sanity.client'
import { SUBDIVISIONS } from '@lib/constants'

export default async function FbsPage({ params }: { params: { page: string } }) {
  const { page } = params
  const { posts, totalPosts } = await getSubdivisionPosts(SUBDIVISIONS.fbs, parseInt(page, 10))
  const totalPages = Math.ceil(totalPosts / 10)

  return (
    <>
      <CategoryHeader
        title="Latest FBS Football News"
        aboveTitle="Football Bowl Subdivision"
        breadCrumbPages={[
          {
            name: SUBDIVISIONS.fbs.toUpperCase(),
            href: `/${SUBDIVISIONS.fbs}`,
          },
        ]}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            <ArticleList
              articles={posts}
              totalPages={totalPages}
              totalPosts={totalPosts}
              currentPage={page}
              path={SUBDIVISIONS.fbs}
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
