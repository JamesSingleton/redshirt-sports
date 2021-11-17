import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { allFCSPosts } from '@lib/sanityGroqQueries'

const FCS = () => {
  return (
    <>
      <NextSeo />
      <div>
        <h1 className="text-4xl text-warmy-gray-900">FCS</h1>
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
