export const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000'

export const STATIC_NAV_ITEMS = [
  {
    title: 'About',
    href: '/about',
  },
  {
    title: 'Contact Us',
    href: '/contact',
  },
]

export const perPage = 12
