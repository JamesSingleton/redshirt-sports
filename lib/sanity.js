import Image from 'next/image'
import Link from 'next/link'
import createImageUrlBuilder from '@sanity/image-url'
import { PortableText } from '@portabletext/react'
import { getImageDimensions } from '@sanity/asset-utils'
import { sanityConfig } from '@lib/config'

export const imageBuilder = createImageUrlBuilder(sanityConfig)
export const urlForImage = (source) => imageBuilder.image(source).auto('format').fit('min')

const ImageComponent = ({ value, isInline }) => {
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

const InternalLink = ({ children, value }) => (
  <Link href={`/${value.slug.current}`} prefetch={false}>
    <a>{children}</a>
  </Link>
)
const myPortableTextComponents = {
  types: {
    image: ImageComponent,
  },
  marks: {
    internalLink: InternalLink,
  },
}

export const PortableTextComponent = ({ value }) => (
  <PortableText components={myPortableTextComponents} value={value} onMissingComponent={false} />
)
