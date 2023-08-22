export const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV !== 'development'
    ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
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

export const defaultTitle =
  'Your Hub for College Football: FCS, FBS, D2, D3, Transfers, News, and Analysis | Redshirt Sports'
