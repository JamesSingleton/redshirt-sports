import { CategoryHeader, ArticleList } from '@components/ui'
import { SocialMediaFollow } from '@components/common'
import { getSubdivisionPosts } from '@lib/sanity.client'
import { FBS } from '@lib/constants'

const breadCrumbPages = [
  {
    name: FBS.toUpperCase(),
    href: `/${FBS}`,
  },
]

export default async function Page() {
  const fbsIndexPosts = await getSubdivisionPosts(FBS.toUpperCase(), 1)

  const { posts, totalPosts } = fbsIndexPosts

  const totalPages = Math.ceil(totalPosts / 10)
  return (
    <>
      <CategoryHeader
        title="Latest FBS Football News"
        aboveTitle="Football Bowl Subdivision"
        breadCrumbPages={breadCrumbPages}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            <ArticleList
              articles={posts}
              totalPages={totalPages}
              totalPosts={totalPosts}
              currentPage="1"
              path={FBS}
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
