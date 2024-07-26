import { Organization, WebSite } from 'schema-dts'

import { HOME_DOMAIN } from './constants'

export const Org: Organization = {
  '@type': 'Organization',
  '@id': `${HOME_DOMAIN}#organization`,
  name: 'Redshirt Sports',
  url: HOME_DOMAIN,
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://x.com/_redshirtsports'],
  logo: {
    '@type': 'ImageObject',
    inLanguage: 'en-US',
    url: `${HOME_DOMAIN}/images/icons/RS_512.png`,
    '@id': `${HOME_DOMAIN}/#logo`,
    contentUrl: `${HOME_DOMAIN}/images/icons/RS_512.png`,
    width: '512',
    height: '512',
    caption: 'Redshirt Sports',
  },
  image: {
    '@id': `${HOME_DOMAIN}/#logo`,
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'advertising@redshirtsports.xyz',
      contactType: 'advertising',
      url: `${HOME_DOMAIN}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'editors@redshirtsports.xyz',
      contactType: 'editorial',
      url: `${HOME_DOMAIN}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'contact@redshirtsports.xyz',
      contactType: 'general',
      url: `${HOME_DOMAIN}/contact`,
    },
  ],
}

export const Web: WebSite = {
  '@type': 'WebSite',
  '@id': `${HOME_DOMAIN}#website`,
  name: 'Redshirt Sports',
  url: HOME_DOMAIN,
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  publisher: {
    '@id': `${HOME_DOMAIN}#organization`,
  },
  inLanguage: 'en-US',
}
