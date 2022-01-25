import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Card } from '@components/ui'
import { CategoryHeader, EmptyState } from '@components/category'
import { getClient } from '@lib/sanity.server'
import { allFCSPosts } from '@lib/sanityGroqQueries'
import type { Post } from '@lib/types/post'

interface fcsProps {
  fcsPosts: Post[]
}

const FCS = ({ fcsPosts }: fcsProps) => {
  return (
    <>
      <NextSeo
        title="FCS Football"
        description="All Articles by Redshirt Sports on NCAA Division 1 Football Championship Subdivision"
        canonical="https://www.redshirtsports.xyz/fcs"
        openGraph={{
          title: 'FCS Football - Redshirt Sports',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Championship Subdivision',
        }}
      />
      <div className="container mx-auto px-4 xl:px-32 py-12 lg:py-24">
        <div className="flex flex-col mb-4 relative">
          <CategoryHeader
            heading="FCS Football"
            subHeading="NCAA Division 1 Football Championship Subdivision"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fcsPosts &&
            fcsPosts.map((post) => (
              <Card
                key={post.title}
                post={post}
                location="FCS"
                showExcerpt={true}
              />
            ))}
        </div>
      </div>
    </>
  )
}

FCS.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const fcsPosts = await getClient().fetch(allFCSPosts)

  return {
    props: {
      fcsPosts,
    },
  }
}

export default FCS
