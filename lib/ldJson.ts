import { Organization, WebSite } from 'schema-dts'

import { HOME_DOMAIN } from './constants'

export const Org: Organization = {
  '@type': 'NewsMediaOrganization',
  '@id': `${HOME_DOMAIN}#organization`,
  name: process.env.NEXT_PUBLIC_APP_NAME,
  foundingDate: '2021',
  founder: {
    '@type': 'Person',
    name: 'James Singleton',
    url: `${HOME_DOMAIN}/authors/james-singleton`,
  },
  url: HOME_DOMAIN,
  sameAs: [
    'https://www.facebook.com/RedshirtSportsNews',
    'https://x.com/_redshirtsports',
    'https://www.youtube.com/@Redshirt-Sports',
  ],
  logo: {
    '@type': 'ImageObject',
    inLanguage: 'en-US',
    url: `${HOME_DOMAIN}/images/icons/RS_512.png`,
    '@id': `${HOME_DOMAIN}/#logo`,
    contentUrl: `${HOME_DOMAIN}/images/icons/RS_512.png`,
    width: '512',
    height: '512',
    caption: `${process.env.NEXT_PUBLIC_APP_NAME} Logo`,
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
  name: process.env.NEXT_PUBLIC_APP_NAME,
  url: HOME_DOMAIN,
  description: `${process.env.NEXT_PUBLIC_APP_NAME} brings you the latest in FCS football, Top 25 voting, and transfer news. Get insights and updates on FBS, D2, and D3 football as well.`,
  publisher: {
    '@id': `${HOME_DOMAIN}#organization`,
  },
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${HOME_DOMAIN}/search?q={search_term_string}`,
    name: 'Search',
    // @ts-ignore this is a valid property
    'query-input': 'required name=search_term_string',
  },
}
