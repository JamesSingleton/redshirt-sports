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
      <Container>
        <CategoryHeader
          heading="FCS"
          subHeading="NCAA Division 1 Football Championship Subdivision"
        />
        {/* Loop over articles */}
        <div className="pt-6">
          {fcsPosts &&
            fcsPosts.map((post) => (
              <ArticleSnippet key={post.title} post={post} />
            ))}
          {fcsPosts.length === 0 && <EmptyState />}
        </div>
      </Container>
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
