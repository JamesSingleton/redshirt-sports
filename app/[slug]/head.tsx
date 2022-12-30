import MetaDescription from '@components/common/MetaDescription'
import { getPostMetaDataInfoBySlug } from '@lib/sanity.client'
import { urlForImage } from '@lib/sanity.image'
import { SITE_URL } from '@lib/constants'

export default async function Head({ params }: { params: { slug: string } }) {
  const metaData = await getPostMetaDataInfoBySlug(params.slug)
  let readingTime
  if (metaData.estimatedReadingTime === 1) {
    readingTime = `${metaData.estimatedReadingTime} minute`
  } else {
    readingTime = `${metaData.estimatedReadingTime} minutes`
  }
  return (
    <>
      <title>{`${metaData?.title} | Redshirt Sports`}</title>
      <MetaDescription value={metaData?.excerpt} />
      <meta property="og:title" content={`${metaData?.title} | Redshirt Sports`} />
      {/* meta tag for og image */}
      <meta
        property="og:image"
        content={`${SITE_URL}/api/article-og?${new URLSearchParams({
          slug: params.slug,
        })}`}
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={metaData?.mainImage.caption} />
      <meta property="og:type" content="article" />
      <meta name="author" content={metaData.author.name} />
      <meta name="twitter:label1" content="Written by" />
      <meta name="twitter:data1" content={metaData.author.name} />
      <meta name="twitter:label2" content="Est. reading time" />
      <meta name="twitter:data2" content={readingTime} />
      <meta property="article:published_time" content={metaData?.publishedAt} />
      <meta property="article:modified_time" content={metaData?._updatedAt} />
      <meta
        property="article:author"
        content={`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/authors/${
          metaData.author.slug
        }`}
      />
      <meta
        property="og:url"
        content={`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/${
          metaData.slug
        }`}
      />
    </>
  )
}
