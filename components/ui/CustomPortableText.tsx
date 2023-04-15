import Link from 'next/link'
import Image from 'next/image'
import {
  PortableText,
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from '@portabletext/react'
import { PortableTextBlock } from 'sanity'
import { Tweet } from 'react-tweet'

import type { TweetComponents } from 'react-tweet'

const InternalLink = ({ children, value }: PortableTextMarkComponentProps) => {
  let linkHref = `/${value?.slug.current}`

  if (value?.parentSlug) {
    linkHref = `/${value.parentSlug}/${value.slug.current}`
  }

  return (
    <Link href={linkHref} prefetch={false} className="underline transition hover:opacity-50">
      {children}
    </Link>
  )
}

const TweetComponents: TweetComponents = {
  AvatarImg: (props) => <Image {...props} alt={props.alt} />,
  MediaImg: (props) => <Image {...props} alt={props.alt} fill unoptimized />,
}

export function CustomPortableText({
  paragraphClasses,
  value,
}: {
  paragraphClasses?: string
  value: PortableTextBlock[]
}) {
  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => {
        return <p className={paragraphClasses}>{children}</p>
      },
    },
    marks: {
      internalLink: InternalLink,
      link: ({ value, children }: PortableTextMarkComponentProps) => {
        return value?.blank ? (
          <a
            className="underline transition hover:opacity-50"
            href={value?.href}
            rel="noreferrer noopener"
          >
            {children}
          </a>
        ) : (
          <a className="underline transition hover:opacity-50" href={value?.href}>
            {children}
          </a>
        )
      },
    },
    types: {
      twitter: ({ value }) => {
        return (
          <div className="not-prose flex items-center justify-center">
            <Tweet id={value.id} components={TweetComponents} />
          </div>
        )
      },
    },
  }

  return <PortableText components={components} value={value} />
}