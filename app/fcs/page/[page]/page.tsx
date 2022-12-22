import { getTotalPosts, getFCSPosts } from '@lib/sanity.client'
import { ArticleList, CategoryHeader } from '@components/ui'
import { SocialMediaFollow } from '@components/common'

export async function generateStaticParams() {
  const totalPosts = await getTotalPosts('FCS')
  const totalPages = Math.ceil(totalPosts / 10)
  const paths = []

  for (let page = 2; page <= totalPages; page++) {
    paths.push({ page: page.toString() })
  }

  return paths
}

const breadCrumbPages = [
  {
    name: 'FCS',
    href: '/fcs',
  },
]

export default async function Page({ params }: { params: { page: string } }) {
  const { page } = params

  const { posts, totalPosts } = await getFCSPosts(parseInt(page, 10))
  const totalPages = Math.ceil(totalPosts / 10)

  return (
    <>
      <CategoryHeader
        title="Latest FCS News"
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
