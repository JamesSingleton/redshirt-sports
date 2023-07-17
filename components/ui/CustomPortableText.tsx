import Link from 'next/link'
import Image from 'next/image'
import {
  PortableText,
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from '@portabletext/react'
import { PortableTextBlock } from 'sanity'
import { Tweet } from 'react-tweet'

import ImageComponent from './ImageComponent'

import type { TwitterComponents } from 'react-tweet'

const InternalLink = ({ children, value }: PortableTextMarkComponentProps) => {
  let linkHref = `/${value?.slug.current}`

  if (value?.parentSlug) {
    linkHref = `/${value.parentSlug}/${value.slug.current}`
  }

  return (
    <Link href={linkHref} className="underline transition hover:opacity-50">
      {children}
    </Link>
  )
}

const TweetComponents: TwitterComponents = {
  AvatarImg: (props) => <Image {...props} alt={props.alt} />,
  MediaImg: (props) => <Image {...props} alt={props.alt} fill unoptimized />,
}

const ImageEmbed = ({ value }: { value: any }) => {
  return (
    <figure className="my-2 flex flex-col self-center rounded-lg shadow-md">
      <ImageComponent image={value} className="rounded-lg" width={720} height={379} />
    </figure>
  )
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
            target="_blank"
            aria-label={`Opens ${value?.href} in a new tab`}
            title={`Opens ${value?.href} in a new tab`}
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
      image: ImageEmbed,
    },
  }

  return <PortableText components={components} value={value} />
}
