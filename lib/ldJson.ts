export const Organization = {
  '@type': 'Organization',
  '@id': 'https://www.redshirtsports.xyz/#organization',
  name: 'Redshirt Sports',
  url: 'https://www.redshirtsports.xyz',
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  logo: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
  image: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
}

export const WebSite = {
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
}
