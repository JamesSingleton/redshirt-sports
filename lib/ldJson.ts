import { Organization, WebSite } from 'schema-dts'

export const Org: Organization = {
  '@type': 'Organization',
  '@id': 'https://www.redshirtsports.xyz/#organization',
  name: 'Redshirt Sports',
  url: 'https://www.redshirtsports.xyz',
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  logo: {
    '@type': 'ImageObject',
    inLanguage: 'en-US',
    url: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
    '@id': 'https://www.redshirtsports.xyz/#logo',
    contentUrl: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
    width: '512',
    height: '512',
    caption: 'Redshirt Sports',
  },
  image: {
    '@id': 'https://www.redshirtsports.xyz/#logo',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'advertising@redshirtsports.xyz',
      contactType: 'advertising',
      url: 'https://www.redshirtsports.xyz/contact',
    },
    {
      '@type': 'ContactPoint',
      email: 'editors@redshirtsports.xyz',
      contactType: 'editorial',
      url: 'https://www.redshirtsports.xyz/contact',
    },
    {
      '@type': 'ContactPoint',
      email: 'contact@redshirtsports.xyz',
      contactType: 'general',
      url: 'https://www.redshirtsports.xyz/contact',
    },
  ],
}

export const Web: WebSite = {
  '@type': 'WebSite',
  '@id': 'https://www.redshirtsports.xyz/#website',
  name: 'Redshirt Sports',
  url: 'https://www.redshirtsports.xyz',
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  publisher: {
    '@id': 'https://www.redshirtsports.xyz/#organization',
  },
  inLanguage: 'en-US',
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.redshirtsports.xyz/search?q={search_term_string}',
      },
      query: 'required name=search_term_string',
    },
  ],
}
