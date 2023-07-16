import 'tailwindcss/tailwind.css'

export const metadata = {
  title: 'Sanity CMS | Redshirt Sports',
  description: 'The CMS for Redshirt Sports',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
