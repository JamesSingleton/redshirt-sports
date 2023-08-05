import { Organization, WebSite } from 'schema-dts'

import { baseUrl } from './constants'

export const Org: Organization = {
  '@type': 'Organization',
  '@id': `${baseUrl}/#organization`,
  name: 'Redshirt Sports',
  url: baseUrl,
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  logo: {
    '@type': 'ImageObject',
    inLanguage: 'en-US',
    url: `${baseUrl}/images/icons/RS_512.png`,
    '@id': `${baseUrl}/#logo`,
    contentUrl: `${baseUrl}/images/icons/RS_512.png`,
    width: '512',
    height: '512',
    caption: 'Redshirt Sports',
  },
  image: {
    '@id': `${baseUrl}/#logo`,
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'advertising@redshirtsports.xyz',
      contactType: 'advertising',
      url: `${baseUrl}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'editors@redshirtsports.xyz',
      contactType: 'editorial',
      url: `${baseUrl}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'contact@redshirtsports.xyz',
      contactType: 'general',
      url: `${baseUrl}/contact`,
    },
  ],
}

export const Web: WebSite = {
  '@type': 'WebSite',
  '@id': `${baseUrl}/#website`,
  name: 'Redshirt Sports',
  url: baseUrl,
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  publisher: {
    '@id': `${baseUrl}/#organization`,
  },
  inLanguage: 'en-US',
}
