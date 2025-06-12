import type {
  Article,
  ContactPoint,
  ImageObject,
  Organization,
  Person,
  WebPage,
  WebSite,
  WithContext,
} from 'schema-dts'

import { urlFor } from '@/lib/sanity/client'
import { getBaseUrl } from '@/lib/get-base-url'

interface RichTextChild {
  _type: string
  text?: string
  marks?: string[]
  _key: string
}

interface RichTextBlock {
  _type: string
  children?: RichTextChild[]
  style?: string
  _key: string
}

// Utility function to safely extract plain text from rich text blocks
function extractPlainTextFromRichText(richText: RichTextBlock[] | null | undefined): string {
  if (!Array.isArray(richText)) return ''

  return richText
    .filter((block) => block._type === 'block' && Array.isArray(block.children))
    .map(
      (block) =>
        block.children
          ?.filter((child) => child._type === 'span' && Boolean(child.text))
          .map((child) => child.text)
          .join('') ?? '',
    )
    .join(' ')
    .trim()
}

export function JsonLdScript<T>({ data, id }: { data: T; id: string }) {
  return (
    <script type="application/ld+json" id={id}>
      {JSON.stringify(data, null, 0)}
    </script>
  )
}

export function buildSafeImageUrl(image?: { asset?: { _ref: string } }) {
  if (!image?.asset?._ref) {
    return undefined
  }
  return urlFor({ ...image, _id: image.asset?._ref })
    .size(1920, 1080)
    .dpr(2)
    .auto('format')
    .quality(80)
    .url()
}

export function ArticleJsonLd({ article }) {
  if (!article) return null

  const baseUrl = getBaseUrl()
  const articleUrl = `${baseUrl}/${article.slug}`
  const imageUrl = buildSafeImageUrl(article.mainImage)

  const articleJsonLd: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: imageUrl ? [imageUrl] : undefined,
    author: article.authors
      ? article.authors.map((author) => {
          return {
            '@type': 'Person',
            name: author.name,
            url: author.slug ? `${baseUrl}/${author.slug}` : undefined,
          } as Person
        })
      : [],
    publisher: {
      '@type': 'Organization',
      name: 'Redshirt Sports',
    } as Organization,
    datePublished: new Date(article.publishedAt).toISOString(),
    dateModified: new Date(article._updatedAt).toISOString(),
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    } as WebPage,
  }

  return <JsonLdScript data={articleJsonLd} id={`article-json-ld-${article.slug}`} />
}

export function OrganizationJsonLd({ settings }) {
  if (!settings) return null

  const baseUrl = getBaseUrl()

  const socialLinks = settings.socialLinks
    ? (Object.values(settings.socialLinks).filter(Boolean) as string[])
    : undefined

  const organizationJsonLd: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.name || 'Redshirt Sports',
    description: settings.siteDescription || undefined,
    url: baseUrl,
    logo: settings.logo
      ? ({
          '@type': 'ImageObject',
          url: settings.logo,
        } as ImageObject)
      : undefined,
    contactPoint: settings.contactEmail
      ? ({
          '@type': 'ContactPoint',
          email: settings.contactEmail,
          contactType: 'customer service',
        } as ContactPoint)
      : undefined,
    sameAs: socialLinks?.length ? socialLinks : undefined,
  }

  return <JsonLdScript data={organizationJsonLd} id="organization-json-ld" />
}

export function WebSiteJsonLd({ settings }) {
  if (!settings) return null

  const baseUrl = getBaseUrl()

  const webSiteJsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    name: settings.name || 'Redshirt Sports',
    description: settings.siteDescription || undefined,
    // potentialAction: {
    //   '@type': 'SearchAction',
    //   target: `${baseUrl}/search?q={search_term_string}`,
    //   'query-input': 'required name=search_term_string',
    // },
  }

  return <JsonLdScript data={webSiteJsonLd} id="website-json-ld" />
}

export async function CombinedJsonLd({}) {
  return <></>
}
