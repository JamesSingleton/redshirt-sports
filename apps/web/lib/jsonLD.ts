import { getBaseUrl } from './get-base-url'
import { buildSafeImageUrl } from '@/components/json-ld'

import type { Graph, ListItem, Organization, WebSite } from 'schema-dts'

const baseUrl = getBaseUrl()

export const organizationId = `${baseUrl}/#organization`
export const websiteId = `${baseUrl}/#website`

export const getOrganizationJsonLd = (): Organization => {
  return {
    '@type': 'Organization',
    '@id': organizationId,
    name: process.env.NEXT_PUBLIC_APP_NAME,
    url: baseUrl,
    sameAs: [
      'https://x.com/_redshirtsports',
      'https://www.facebook.com/RedshirtSportsNews/',
      'https://www.youtube.com/@Redshirt-Sports',
    ],
  }
}

export const getWebSiteJsonLd = (): WebSite => {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: baseUrl,
    name: process.env.NEXT_PUBLIC_APP_NAME,
    publisher: { '@id': organizationId },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        'query-input': {
          '@type': 'PropertyValueSpecification',
          valueRequired: true,
          valueName: 'search_term_string',
        },
      },
    ],
    inLanguage: 'en-US',
  }
}
