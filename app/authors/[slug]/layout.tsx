import Script from 'next/script'

import { getAuthorBySlug } from '@lib/sanity.client'
import { createAuthorLDJson } from '@lib/createLDJson'

export default async function AuthorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const author = await getAuthorBySlug(params.slug)
  const content = createAuthorLDJson(author)
  return (
    <>
      <main>{children}</main>
      <Script
        id={`author-ld-json-${author.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(content) }}
      />
    </>
  )
}
