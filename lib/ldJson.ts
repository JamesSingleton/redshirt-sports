import { SITE_URL } from './constants'

export const Organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Redshirt Sports',
  url: SITE_URL,
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  logo: `${SITE_URL}/images/icons/RS_512.png`,
  image: `${SITE_URL}/images/icons/RS_512.png`,
}

export const WebSite = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Redshirt Sports',
  url: SITE_URL,
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  publisher: {
    '@id': `${SITE_URL}/#organization`,
  },
  inLanguage: 'en-US',
}
