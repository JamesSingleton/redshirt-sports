import Image from 'next/image'
import Link from 'next/link'

import createImageUrlBuilder from '@sanity/image-url'
import { PortableText, PortableTextMarkComponentProps } from '@portabletext/react'
import { getImageDimensions } from '@sanity/asset-utils'
import { sanityConfig } from '@lib/config'
import { Tweet } from '@components/ui'

export const imageBuilder = createImageUrlBuilder(sanityConfig as any)
export const urlForImage = (source: any) => imageBuilder.image(source).auto('format').fit('min')
export const urlForRSSImage = (source: any) => imageBuilder.image(source)

const ImageComponent = ({ value, isInline }: { value: any; isInline: any }) => {
  const { width, height } = getImageDimensions(value)
  return (
    <Image
      src={urlForImage(value).fit('min').auto('format').url()}
      alt={value.alt || ' '}
      width={width}
      height={height}
      layout="responsive"
      sizes="50vw"
    />
  )
}

export const InternalLink = ({ children, value }: PortableTextMarkComponentProps) => {
  return (
    <Link href={`/${value?.slug.current}`} prefetch={false}>
      <a>{children}</a>
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
  },
}

export const PortableTextComponent = ({ value }: { value: any }) => (
  <PortableText components={myPortableTextComponents} value={value} />
)
