import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { ArticleSnippet, CategoryHeader } from '@components/category'
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
        title="FBS Football"
        description="All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision"
        openGraph={{
          title: 'FBS Football',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision',
        }}
      />
      <div className="mx-auto py-12 px-4 max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <CategoryHeader
          heading="FBS"
          subHeading="NCAA Division 1 Football Bowl Subdivision"
        />
        {/* Loop over articles */}
        <div className="pt-6">
          {fcsPosts &&
            fcsPosts.map((post) => (
              <ArticleSnippet key={post.title} post={post} />
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
