import 'tailwindcss/tailwind.css'
import clsx from 'clsx'

import { cal, inter } from '@styles/fonts'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={clsx(cal.variable, inter.variable)}>
      <body>{children}</body>
    </html>
  )
}
