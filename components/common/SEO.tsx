import { FC, Fragment, ReactNode } from 'react'
import Head from 'next/head'
import config from '@config/seo.json'

const websiteBaseUrl = 'https://www.redshirtsports.xyz'

interface OgImage {
  url?: string
  width?: string
  height?: string
  alt?: string
}

interface OgArticle {
  publishedTime?: string
  modifiedTime?: string
  section?: string
  authors?: string[]
  tags?: string[]
}

interface Props {
  title?: string
  description?: string
  robots?: string
  canonical?: string
  openGraph?: {
    title?: string
    type?: string
    locale?: string
    description?: string
    site_name?: string
    url?: string
    images?: OgImage[]
    article?: OgArticle
    profile?: {
      firstName?: string
      lastName?: string
    }
  }
  children?: ReactNode
}

const ogImage = ({ url, width, height, alt }: OgImage, index: number) => {
  // generate full URL for OG image url with website base URL
  const imgUrl = websiteBaseUrl ? new URL(url!, websiteBaseUrl).toString() : url
  return (
    <Fragment key={`og:image:${index}`}>
      <meta key={`og:image:url:${index}`} property="og:image" content={imgUrl} />
      <meta key={`og:image:width:${index}`} property="og:image:width" content={width} />
      <meta key={`og:image:height:${index}`} property="og:image:height" content={height} />
      <meta key={`og:image:alt:${index}`} property="og:image:alt" content={alt} />
    </Fragment>
  )
}

const SEO: FC<Props> = ({ title, description, canonical, openGraph, robots, children }) => {
  /**
   * @see https://nextjs.org/docs/api-reference/next/head
   *
   * meta or any other elements need to be contained as direct children of the Head element,
   * or wrapped into maximum one level of <React.Fragment> or arrays
   * otherwise the tags won't be correctly picked up on client-side navigations.
   *
   * The `key` property makes the tag is only rendered once,
   */

  return (
    <Head>
      <title key="title">
        {title ? `${config.titleTemplate.replace(/%s/g, title)}` : config.title}
      </title>
      <meta key="description" name="description" content={description || config.description} />
      <meta key="og:type" property="og:type" content={openGraph?.type ?? config.openGraph.type} />
      <meta
        key="og:title"
        property="og:title"
        content={openGraph?.title ?? config.openGraph.title ?? title ?? config.title}
      />
      <meta
        key="og:description"
        property="og:description"
        content={
          openGraph?.description ??
          config.openGraph.description ??
          description ??
          config.description
        }
      />
      <meta
        key="og:site_name"
        property="og:site_name"
        content={openGraph?.site_name ?? config.openGraph.site_name}
      />
      <meta key="og:url" property="og:url" content={openGraph?.url ?? config.openGraph.url} />
      <meta
        key="og:locale"
        property="og:locale"
        content={openGraph?.locale ?? config.openGraph.locale}
      />
      {openGraph?.images?.length
        ? openGraph.images.map((img, index) => ogImage(img, index))
        : ogImage(config.openGraph.images[0], 0)}

      {openGraph?.article && (
        <Fragment key="og:article">
          <meta
            key="og:article:published_time"
            property="og:article:published_time"
            content={openGraph.article.publishedTime}
          />
          <meta
            key="og:article:modified_time"
            property="og:article:modified_time"
            content={openGraph.article.modifiedTime}
          />
          <meta
            key="og:article:section"
            property="og:article:section"
            content={openGraph.article.section}
          />
          {openGraph.article.authors?.length &&
            openGraph.article.authors.map((author, index) => (
              <meta
                key={`og:article:author:${index}`}
                property="og:article:author"
                content={author}
              />
            ))}
          {openGraph.article.tags?.length &&
            openGraph.article.tags.map((tag, index) => (
              <meta key={`og:article:tag:${index}`} property="og:article:tag" content={tag} />
            ))}
        </Fragment>
      )}
      {openGraph?.profile && (
        <Fragment key="og:profile">
          <meta
            key="og:profile:first_name"
            property="og:profile:first_name"
            content={openGraph.profile.firstName}
          />
          <meta
            key="og:profile:last_name"
            property="og:profile:last_name"
            content={openGraph.profile.lastName}
          />
        </Fragment>
      )}
      {config.twitter.cardType && (
        <meta key="twitter:card" name="twitter:card" content={config.twitter.cardType} />
      )}
      {config.twitter.site && (
        <meta key="twitter:site" name="twitter:site" content={config.twitter.site} />
      )}
      {config.twitter.handle && (
        <meta key="twitter:creator" name="twitter:creator" content={config.twitter.handle} />
      )}
      <meta
        key="robots"
        name="robots"
        content={
          robots ?? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />
      <meta
        key="googlebot"
        name="googlebot"
        content={
          robots ?? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />
      <link key="canonical" rel="canonical" href={canonical} />
      {children}
    </Head>
  )
}

export default SEO
