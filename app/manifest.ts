import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Redshirt Sports',
    short_name: 'Redshirt Sports',
    description:
      'Explore the diverse realm of college football at Redshirt Sports. From FCS to FBS, D2 to D3, stay updated on news, analysis, and the latest in transfers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#DC2727',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
