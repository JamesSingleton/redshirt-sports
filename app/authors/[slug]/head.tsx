import Script from 'next/script'

import DefaultMetaTags from '@components/common/DefaultMetaTags'
import { getAuthorMetaDataInfoBySlug } from '@lib/sanity.client'
import MetaDescription from '@components/common/MetaDescription'
import { createAuthorLDJson } from '@lib/createLDJson'

export default async function Head({ params }: { params: { slug: string } }) {
  const author = await getAuthorMetaDataInfoBySlug(params.slug)
  const content = createAuthorLDJson(author)
  const [firstName, lastName] = author.name.split(' ')
  return (
    <>
      <title>{`${author.role} ${author.name} | Redshirt Sports`}</title>
      <meta property="og:title" content={`${author.role} ${author.name} | Redshirt Sports`} />
      <MetaDescription
        value={`Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`}
      />
      <DefaultMetaTags />
      <link rel="canonical" href={`https://redshirtsports.com/authors/${author.slug}`} />
      <meta property="og:url" content={`https://redshirtsports.com/authors/${author.slug}`} />
      <meta property="og:type" content="profile" />
      <meta property="profile:first_name" content={firstName} />
      <meta property="profile:last_name" content={lastName} />
      <Script
        id={`author-ld-json-${author.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(content) }}
      />
    </>
  )
}
