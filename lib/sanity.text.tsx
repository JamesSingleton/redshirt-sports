import Image from 'next/image'
import Link from 'next/link'
import { PortableText, PortableTextMarkComponentProps } from '@portabletext/react'
import { getImageDimensions } from '@sanity/asset-utils'

import { Tweet } from '@components/ui'
import { urlForImage } from './sanity.image'

const ImageComponent = ({ value, isInline }: { value: any; isInline: any }) => {
  const { width, height } = getImageDimensions(value)
  return (
    <Image
      src={urlForImage(value).fit('min').auto('format').url()}
      alt={value.caption || ' '}
      width={width}
      height={height}
    />
  )
}

export const InternalLink = ({ children, value }: PortableTextMarkComponentProps) => {
  let linkHref = `/${value?.slug.current}`

  if (value?.parentSlug) {
    linkHref = `/${value.parentSlug}/${value.slug.current}`
  }

  return (
    <Link href={linkHref} prefetch={false}>
      {children}
    </Link>
  )
}

export const TwitterComponent = ({ value }: { value: any }) => {
  return <Tweet id={value.id} metadata={JSON.stringify(value.metadata)} />
}
const myPortableTextComponents = {
  types: {
    image: ImageComponent,
    twitter: TwitterComponent,
  },
  marks: {
    internalLink: InternalLink,
    link: ({ value, children }: PortableTextMarkComponentProps) => {
      return value?.blank ? (
        <a href={value.href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <a href={value?.href}>{children}</a>
      )
    },
  },
}

export const PortableTextComponent = ({ value }: { value: any }) => (
  <PortableText components={myPortableTextComponents} value={value} />
)
