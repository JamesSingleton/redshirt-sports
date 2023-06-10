import 'tailwindcss/tailwind.css'
import clsx from 'clsx'

import { cal, inter } from '@styles/fonts'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={clsx(cal.variable, inter.variable, 'dark')}>
      <body className="flex min-h-screen flex-col scroll-smooth bg-white text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  )
}
