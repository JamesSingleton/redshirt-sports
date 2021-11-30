import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Container } from '@components/ui'
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
        canonical="https://www.redshirtsports.xyz/fbs"
        openGraph={{
          title: 'FBS Football - Redshirt Sports',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision',
        }}
      />
      <Container>
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
