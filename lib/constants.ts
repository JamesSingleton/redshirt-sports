export const SITE_URL = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}`

export const NAVIGATION_ITEMS = [
  { name: 'FCS', href: '/fcs' },
  { name: 'FBS', href: '/fbs' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
]

export const FBS = 'fbs'
export const FCS = 'fcs'

export const SUBDIVISIONS = {
  fbs: 'fbs',
  fcs: 'fcs',
}
