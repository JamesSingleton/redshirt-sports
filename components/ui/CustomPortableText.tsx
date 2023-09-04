import Link from 'next/link'
import Image from 'next/image'
import {
  PortableText,
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from '@portabletext/react'
import { PortableTextBlock } from 'sanity'
import { Tweet } from 'react-tweet'
import { CameraIcon } from 'lucide-react'

import ImageComponent from './ImageComponent'

import type { TwitterComponents } from 'react-tweet'

const InternalLink = ({ children, value }: PortableTextMarkComponentProps) => {
  let linkHref = `/${value?.reference.slug}`

  if (value?.reference._type === 'division') {
    linkHref = `/news/${value?.reference.slug}`
  }

  if (value?.reference._type === 'conference') {
    linkHref = `/news/${value?.reference.divisionSlug}/${value?.reference.slug}`
  }

  return (
    <Link href={linkHref} className="underline hover:text-muted-foreground">
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
      <ImageComponent
        image={value}
        mode="contain"
        className="rounded-lg"
        width={720}
        height={379}
      />
      {value.attribution && (
        <figcaption className="flex items-center gap-2 text-sm text-muted-foreground">
          <CameraIcon className="h-4 w-4" />
          <span>Source: {value.attribution}</span>
        </figcaption>
      )}
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
            className="underline hover:text-muted-foreground"
            href={value?.href}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={`Opens ${value?.href} in a new tab`}
            title={`Opens ${value?.href} in a new tab`}
          >
            {children}
          </a>
        ) : (
          <a className="underline hover:text-muted-foreground" href={value?.href}>
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
