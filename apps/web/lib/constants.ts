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

export const HOME_DOMAIN = `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_SITE_URL}`
