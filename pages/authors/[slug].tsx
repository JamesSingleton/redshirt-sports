import { GetStaticProps, GetStaticPaths } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { getClient, sanityClient } from '@lib/sanity.server'
import { authorBySlugQuery, authorSlugsQuery } from '@lib/sanityGroqQueries'

interface AuthorProps {
  author: {
    name: string
    slug: string
    image: string
    bio: string
  }
}

const Author = ({ author }: AuthorProps) => {
  return (
    <>
      <NextSeo title={`${author.name} Profile`} />
      <div>
        <h1>{author.name}</h1>
      </div>
    </>
  )
}

Author.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const author = await getClient().fetch(authorBySlugQuery, {
    slug: params?.slug,
  })

  console.log({ author })
  if (!author) {
    return { notFound: true }
  }
  return {
    props: {
      author,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(authorSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export default Author
