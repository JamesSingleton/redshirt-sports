import './globals.css'

import { Lato, Work_Sans } from 'next/font/google'

const sans = Work_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

const serif = Lato({
  variable: '--font-serif',

  subsets: ['latin'],
  weight: ['400', '700'],
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
