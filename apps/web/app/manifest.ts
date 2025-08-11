import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.NEXT_PUBLIC_APP_NAME,
    short_name: process.env.NEXT_PUBLIC_APP_NAME,
    description: `${process.env.NEXT_PUBLIC_APP_NAME} brings you the latest in FCS football, Top 25 voting, and transfer news. Get insights and updates on FBS, D2, and D3 football as well.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#DC2727',
    icons: [
      {
        src: '/icon1.png',
        sizes: '16x16',
        type: 'image/x-icon',
      },
      {
        src: '/icon2.png',
        sizes: '32x32',
        type: 'image/x-icon',
      },
    ],
  }
}
