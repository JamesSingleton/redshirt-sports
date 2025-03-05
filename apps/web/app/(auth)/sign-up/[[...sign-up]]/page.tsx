import { SignUp } from '@clerk/nextjs'

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

export default function SignUpPage() {
  return (
    <div className="flex justify-center py-24">
      <SignUp />
    </div>
  )
}
