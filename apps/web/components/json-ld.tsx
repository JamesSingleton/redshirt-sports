import { stegaClean } from 'next-sanity'

import { urlFor, client } from '@/lib/sanity/client'
import { getBaseUrl } from '@/lib/get-base-url'
import { querySettingsData } from '@/lib/sanity/query'

import type {
  ContactPoint,
  ImageObject,
  NewsArticle,
  Organization,
  Person,
  WebPage,
  WebSite,
  WithContext,
} from 'schema-dts'

const baseUrl = getBaseUrl()

export const organizationId = `${baseUrl}/#organization`
export const websiteId = `${baseUrl}/#website`

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

export function ArticleJsonLd({ article }: { article: any }) {
  if (!article) return null

  const articleUrl = `${baseUrl}/${article.slug}`
  const imageUrl = buildSafeImageUrl(article.mainImage)

  const articleJsonLd: WithContext<NewsArticle> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${articleUrl}#article`,
    isPartOf: { '@id': articleUrl },
    author: article.authors
      ? article.authors.map((author: any) => {
          return {
            '@type': 'Person',
            name: stegaClean(author.name),
            url: author.slug ? `${baseUrl}/authors/${author.slug}` : undefined,
          } as Person
        })
      : [],
    headline: stegaClean(article.title),
    datePublished: new Date(article.publishedAt).toISOString(),
    dateModified: new Date(article._updatedAt).toISOString(),
    description: stegaClean(article.excerpt),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    } as WebPage,
    wordCount: article.wordCount,
    publisher: { '@id': organizationId },
    image: [
      {
        '@type': 'ImageObject',
        url: imageUrl,
        contentUrl: imageUrl,
        caption: stegaClean(article.mainImage.alt),
        width: '1920',
        height: '1080',
      } as ImageObject,
    ],
    thumbnailUrl: imageUrl,
    url: articleUrl,
    inLanguage: 'en-US',
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: { '@id': organizationId },
    potentialAction: [
      {
        '@type': 'ReadAction',
        target: [articleUrl],
      },
    ],
  }

  return <JsonLdScript data={articleJsonLd} id={`article-json-ld-${article.slug}`} />
}

export function OrganizationJsonLd({ settings }: { settings: any }) {
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
          contactType: 'general',
        } as ContactPoint)
      : undefined,
    sameAs: socialLinks?.length ? socialLinks : undefined,
  }

  return <JsonLdScript data={organizationJsonLd} id="organization-json-ld" />
}

export function WebSiteJsonLd({ settings }: { settings: any }) {
  if (!settings) return null

  const baseUrl = getBaseUrl()

  const webSiteJsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: baseUrl,
    name: settings.siteTitle,
    description: settings.siteDescription || undefined,
    publisher: {
      '@id': organizationId,
    },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        // @ts-expect-error query-input is a valid property
        'query-input': {
          '@type': 'PropertyValueSpecification',
          valueRequired: true,
          valueName: 'search_term_string',
        },
      },
    ],
  }

  return <JsonLdScript data={webSiteJsonLd} id="website-json-ld" />
}

export function WebPageJsonLd() {
  const webPageJsonLd: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
  }
  return <JsonLdScript data={webPageJsonLd} id="webpage-json-ld" />
}

export async function CombinedJsonLd() {
  const res = await client.fetch(querySettingsData)

  return (
    <>
      <OrganizationJsonLd settings={res} />
      <WebSiteJsonLd settings={res} />
    </>
  )
}
