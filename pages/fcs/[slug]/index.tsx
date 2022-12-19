import { SocialMediaFollow } from '@components/common'
import SEO from '@components/common/SEO'
import { CategoryHeader, HorizontalCard } from '@components/ui'
import { getSubCategories, subCategorySlugs } from '@lib/queries'
import { sanityClient } from '@lib/sanity.server'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

export default function SubCategory({
  title,
  slug,
  description,
  parentTitle,
  parentSlug,
  posts,
}: {
  title: string
  slug: string
  description: string
  parentTitle: string
  parentSlug: string
  posts: Post[]
}) {
  const breadCrumbPages = [
    {
      name: parentTitle,
      href: `/${parentSlug}`,
    },
    {
      name: title,
      href: `/${parentSlug}/${slug}`,
    },
  ]
  return (
    <>
      <SEO
        title={`${title} Football`}
        description={description}
        openGraph={{
          title: `${title} Football | Redshirt Sports`,
          description,
          url: `https://www.redshirtsports.xyz/${parentSlug}/${slug}`,
        }}
      />
      <CategoryHeader
        title={`Latest ${title} Football News`}
        aboveTitle="Football Championship Subdivision"
        breadCrumbPages={breadCrumbPages}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            {posts && posts.map((post) => <HorizontalCard key={post._id} post={post} />)}
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const subCategoriesSlugs = await sanityClient.fetch(subCategorySlugs)

  return {
    paths: subCategoriesSlugs.map((slug: string) => ({
      params: { slug: slug.replace('fcs/', '') },
    })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const subCategory = await sanityClient.fetch(getSubCategories, {
    slug: params?.slug,
  })

  if (!subCategory || subCategory === null) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      title: subCategory.title,
      slug: params?.slug,
      description: subCategory.description,
      parentTitle: subCategory.parentTitle,
      parentSlug: subCategory.parentSlug,
      posts: subCategory.posts,
    },
  }
}
