import { toPlainText } from '@portabletext/react'

import { urlForImage } from './sanity.image'
import { Org, Web } from '@lib/ldJson'

import type { Post, Author } from '@types'

export const createPostLDJson = (post: Post) => ({
  '@context': 'http://schema.org',
  '@graph': [
    Org,
    Web,
    {
      '@type': 'ImageObject',
      '@id': `https://www.redshirtsports.xyz/${post.slug}/#primaryimage`,
      inLanguage: 'en-US',
      url: urlForImage(post.mainImage).width(1200).height(676).fit('scale').url(),
      width: 1200,
      height: 676,
      caption: post.mainImage.caption,
    },
    {
      '@type': 'WebPage',
      '@id': `https://www.redshirtsports.xyz/${post.slug}/#webpage`,
      url: `https://www.redshirtsports.xyz/${post.slug}`,
      name: post.title,
      isPartOf: {
        '@id': 'https://www.redshirtsports.xyz/#website',
      },
      primaryImageOfPage: {
        '@id': `https://www.redshirtsports.xyz/${post.slug}/#primaryimage`,
      },
      datePublished: post.publishedAt,
      dateModified: post._updatedAt,
      description: post.excerpt,
      breadcrumb: {
        '@id': `https://www.redshirtsports.xyz/${post.slug}/#breadcrumb`,
      },
      inLanguage: 'en-US',
      potentialAction: [
        {
          '@type': 'ReadAction',
          target: [`https://www.redshirtsports.xyz/${post.slug}`],
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `https://www.redshirtsports.xyz/${post.slug}/#breadcrumb`,
      name: 'Article Breadcrumbs',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.redshirtsports.xyz',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: post.division.name,
          item: `https://www.redshirtsports.xyz/${post.division.slug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: `https://www.redshirtsports.xyz/${post.slug}`,
        },
      ],
    },
    {
      '@type': 'Article',
      '@id': `https://www.redshirtsports.xyz/${post.slug}/#article`,
      isPartOf: {
        '@id': `https://www.redshirtsports.xyz/${post.slug}/#webpage`,
      },
      author: {
        '@id': `https://www.redshirtsports.xyz/authors/${post.author.slug}`,
      },
      headline: post.title,
      datePublished: post.publishedAt,
      dateModified: post._updatedAt,
      mainEntityOfPage: {
        '@id': `https://www.redshirtsports.xyz/${post.slug}/#webpage`,
      },
      wordCount: post.wordCount,
      publisher: {
        '@id': 'https://www.redshirtsports.xyz/#organization',
      },
      image: [
        urlForImage(post.mainImage).width(1920).height(1080).fit('scale').url(),
        urlForImage(post.mainImage).width(640).height(480).url(),
        urlForImage(post.mainImage).width(1200).height(1200).fit('scale').url(),
      ],
      thumbnailUrl: urlForImage(post.mainImage).url(),
      articleSection: [post.division.name],
      inLanguage: 'en-US',
    },
    {
      '@type': 'Person',
      '@id': `https://www.redshirtsports.xyz/authors/${post.author.slug}`,
      name: post.author.name,
      url: `https://www.redshirtsports.xyz/authors/${post.author.slug}`,
      description: toPlainText(post.author.bio),
      image: {
        '@type': 'ImageObject',
        inLanguage: 'en-US',
        url: urlForImage(post.author.image).url(),
        contentUrl: urlForImage(post.author.image).url(),
        caption: post.author.name,
      },
      sameAs: ['https://www.redshirtsports.xyz', post.author.socialMedia.map(({ url }) => url)],
    },
  ],
})

export const createAuthorLDJson = (author: Author) => ({
  '@context': 'http://schema.org',
  '@graph': [
    Org,
    Web,
    {
      '@type': 'ImageObject',
      '@id': `https://www.redshirtsports.xyz/authors/${author.slug}/#primaryimage`,
      inLanguage: 'en-US',
      url: urlForImage(author.image).width(1200).height(676).fit('scale').url(),
      width: 1200,
      height: 676,
      caption: `${author.name}'s profile image`,
    },
    {
      '@type': 'ProfilePage',
      '@id': `https://www.redshirtsports.xyz/authors/${author.slug}`,
      url: `https://www.redshirtsports.xyz/authors/${author.slug}`,
      name: `${author.name}, ${author.role} at Redshirt Sports`,
      isPartOf: {
        '@id': 'https://www.redshirtsports.xyz/#website',
      },
      primaryImageOfPage: {
        '@id': `https://www.redshirtsports.xyz/authors/${author.slug}/#primaryimage`,
      },
      breadcrumb: {
        '@id': `https://www.redshirtsports.xyz/authors/${author.slug}/#breadcrumb`,
      },
      inLanguage: 'en-US',
      potentialAction: [
        {
          '@type': 'ReadAction',
          target: [`https://www.redshirtsports.xyz/authors/${author.slug}`],
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `https://www.redshirtsports.xyz/authors/${author.slug}/#breadcrumb`,
      name: 'Author Breadcrumbs',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.redshirtsports.xyz',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${author.name}, ${author.role} profile page`,
          item: `https://www.redshirtsports.xyz/authors/${author.slug}`,
        },
      ],
    },
    {
      '@type': 'Person',
      '@id': `https://www.redshirtsports.xyz/authors/${author.slug}`,
      name: author.name,
      url: `https://www.redshirtsports.xyz/authors/${author.slug}`,
      description: toPlainText(author.bio),
      image: {
        '@type': 'ImageObject',
        inLanguage: 'en-US',
        url: urlForImage(author.image).url(),
        contentUrl: urlForImage(author.image).url(),
        caption: author.name,
      },
      sameAs: ['https://www.redshirtsports.xyz', author.socialMedia.map(({ url }) => url)],
      mainEntityOfPage: {
        '@id': `https://www.redshirtsports.xyz/authors/${author.slug}`,
      },
    },
  ],
})
