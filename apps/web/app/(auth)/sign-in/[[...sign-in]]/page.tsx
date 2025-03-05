import { SignIn } from '@clerk/nextjs'

import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | Redshirt Sports',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function Page() {
  return (
    <div className="flex justify-center py-24">
      <SignIn />
    </div>
  )
}
