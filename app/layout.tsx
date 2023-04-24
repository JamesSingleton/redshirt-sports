import 'tailwindcss/tailwind.css'
import clsx from 'clsx'

import { cal, inter } from '@styles/fonts'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={clsx(cal.variable, inter.variable, 'dark')}>
      <body className="bg-white text-zinc-900 antialiased dark:bg-zinc-900 dark:text-zinc-200">
        {children}
      </body>
    </html>
  )
}
