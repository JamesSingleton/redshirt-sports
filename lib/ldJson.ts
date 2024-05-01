import { Organization, WebSite } from 'schema-dts'

import { BASE_URL } from './constants'

export const Org: Organization = {
  '@type': 'Organization',
  '@id': `${BASE_URL}#organization`,
  name: 'Redshirt Sports',
  url: BASE_URL,
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  logo: {
    '@type': 'ImageObject',
    inLanguage: 'en-US',
    url: `${BASE_URL}/images/icons/RS_512.png`,
    '@id': `${BASE_URL}/#logo`,
    contentUrl: `${BASE_URL}/images/icons/RS_512.png`,
    width: '512',
    height: '512',
    caption: 'Redshirt Sports',
  },
  image: {
    '@id': `${BASE_URL}/#logo`,
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'advertising@redshirtsports.xyz',
      contactType: 'advertising',
      url: `${BASE_URL}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'editors@redshirtsports.xyz',
      contactType: 'editorial',
      url: `${BASE_URL}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'contact@redshirtsports.xyz',
      contactType: 'general',
      url: `${BASE_URL}/contact`,
    },
  ],
}

export const Web: WebSite = {
  '@type': 'WebSite',
  '@id': `${BASE_URL}#website`,
  name: 'Redshirt Sports',
  url: BASE_URL,
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  publisher: {
    '@id': `${BASE_URL}#organization`,
  },
  inLanguage: 'en-US',
}
