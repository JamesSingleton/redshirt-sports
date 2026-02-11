'use client'

import Link from 'next/link'
import posthog from 'posthog-js'

type ContactEmailLinkProps = {
  email: string
  category: string
}

export function ContactEmailLink({ email, category }: ContactEmailLinkProps) {
  const handleClick = () => {
    posthog.capture('contact_email_clicked', {
      email_category: category,
      email_address: email,
    })
  }

  return (
    <Link
      href={`mailto:${email}`}
      onClick={handleClick}
      className="text-primary text-sm break-all hover:underline sm:text-base"
    >
      {email}
    </Link>
  )
}
