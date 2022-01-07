import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Container } from '@components/ui'
import {
  ArticleSnippet,
  CategoryHeader,
  EmptyState,
} from '@components/category'
import { getClient } from '@lib/sanity.server'
import { allFBSPosts } from '@lib/sanityGroqQueries'
import type { Post } from '@lib/types/post'

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
      />
      <Container>
        <CategoryHeader
          heading="FBS Football"
          subHeading="NCAA Division 1 Football Bowl Subdivision"
        />
        {/* Loop over articles */}
        <div className="mt-6">
          <div className="space-y-8">
            {fbsPosts &&
              fbsPosts.map((post) => (
                <ArticleSnippet key={post.title} post={post} location="FBS" />
              ))}
            {fbsPosts.length === 0 && <EmptyState />}
          </div>
        </div>
      </Container>
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
    revalidate: 7200, // Revalidate every 2 hours
  }
}

export default FBS
