import { CategoryHeader, ArticleList } from '@components/ui'
import { SocialMediaFollow } from '@components/common'

const breadCrumbPages = [
  {
    name: 'FBS',
    href: '/fbs',
  },
]

export default async function Page() {
  return (
    <>
      <CategoryHeader
        title="Latest FBS Football News"
        aboveTitle="Football Bowl Subdivision"
        breadCrumbPages={breadCrumbPages}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2"></div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
