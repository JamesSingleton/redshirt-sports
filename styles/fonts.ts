import localFont from 'next/font/local'
import { Inter } from 'next/font/google'

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})
export const cal = localFont({
  src: './CalSans-SemiBold.woff2',
  variable: '--font-cal',
  weight: '600',
  display: 'swap',
})

export const calTitle = localFont({
  src: './CalSans-SemiBold.woff2',
  variable: '--font-title',
  weight: '600',
  display: 'swap',
})
