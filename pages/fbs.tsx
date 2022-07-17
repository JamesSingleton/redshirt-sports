import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Card } from '@components/ui'
import { CategoryHeader, EmptyState } from '@components/category'
import { getClient } from '@lib/sanity.server'
import { allFBSPosts } from '@lib/queries'

import type { Post } from '@types'

interface fbsProps {
  fbsPosts: Post[]
}

const FBS = ({ fbsPosts }: fbsProps) => {
  return (
    <>
      <NextSeo
        title="FBS Football"
        description="All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision"
        canonical="https://www.redshirtsports.xyz/fbs"
        openGraph={{
          title: 'FBS Football - Redshirt Sports',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision',
        }}
        robotsProps={{
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: -1,
        }}
      />
      <div className="container mx-auto px-4 py-12 lg:py-24 xl:px-32">
        <div className="relative mb-4 flex flex-col">
          <CategoryHeader
            heading="FBS Football"
            subHeading="NCAA Division 1 Football Bowl Subdivision"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fbsPosts &&
            fbsPosts.map((post) => (
              <Card key={post.title} post={post} location="FBS" showExcerpt={true} />
            ))}
        </div>
      </div>
    </>
  )
}

FBS.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const fbsPosts = await getClient().fetch(allFBSPosts)

  return {
    props: {
      fbsPosts,
    },
  }
}

export default FBS
