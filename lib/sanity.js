import Image from 'next/image'
import createImageUrlBuilder from '@sanity/image-url'
import { PortableText as PortableTextComponent } from '@portabletext/react'
import { getImageDimensions } from '@sanity/asset-utils'
import { sanityConfig } from './config'

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
const myPortableTextComponents = {
  types: {
    image: ImageComponent,
  },
}

export const PortableText = (props) => (
  <PortableTextComponent components={myPortableTextComponents} {...props} />
)
