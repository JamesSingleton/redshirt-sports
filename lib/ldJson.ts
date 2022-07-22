export const Organization = {
  '@type': 'Organization',
  '@id': 'https://www.redshirtsports.xyz/#organization',
  name: 'Redshirt Sports',
  url: 'https://www.redshirtsports.xyz',
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  logo: {
    '@type': 'ImageObject',
    '@id': 'https://www.redshirtsports.xyz/#logo',
    inLanguage: 'en-US',
    url: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
    contentUrl: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
    width: 512,
    height: 512,
    caption: 'Redshirt Sports',
  },
  image: {
    '@id': 'https://www.redshirtsports.xyz/#logo',
  },
}

export const WebSite = {
  '@type': 'WebSite',
  '@id': 'https://www.redshirtsports.xyz/#website',
  name: 'Redshirt Sports',
  url: 'https://www.redshirtsports.xyz/',
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  publisher: {
    '@id': 'https://www.redshirtsports.xyz/#organization',
  },
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: 'https://www.redshirtsports.xyz/search?query={search_term_string}',
      'query-input': 'required query=search_term_string',
    },
  ],
  inLanguage: 'en-US',
}
