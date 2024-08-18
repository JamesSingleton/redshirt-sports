import createImageUrlBuilder from '@sanity/image-url'
import { Image as SanityImage, type ImageProps } from 'next-sanity/image'

import { projectId, dataset } from '@/lib/sanity.api'

const imageBuilder = createImageUrlBuilder({
  projectId,
  dataset,
})

export const urlForImage = (source: Parameters<(typeof imageBuilder)['image']>[0]) =>
  imageBuilder.image(source)

export function Image(
  props: Omit<ImageProps, 'src' | 'alt'> & {
    src: {
      _key?: string | null
      _type?: 'image' | string
      asset: {
        _type: 'reference'
        _ref: string
        metadata: {
          lqip?: string
        }
      }
      crop: {
        top: number
        bottom: number
        left: number
        right: number
      } | null
      hotspot: {
        x: number
        y: number
        height: number
        width: number
      } | null
      caption?: string | undefined
    }
    alt?: string
  },
) {
  const { src, ...rest } = props
  const imageBuilder = urlForImage(props.src)
  if (props.width) {
    imageBuilder.width(typeof props.width === 'string' ? parseInt(props.width, 10) : props.width)
  }
  if (props.height) {
    imageBuilder.height(
      typeof props.height === 'string' ? parseInt(props.height, 10) : props.height,
    )
  }

  return (
    <SanityImage
      alt={typeof src.caption === 'string' ? src.caption : ''}
      placeholder="blur"
      blurDataURL={src.asset.metadata?.lqip ?? imageBuilder.width(24).height(24).blur(10).url()}
      src={imageBuilder.url()}
      {...rest}
    />
  )
}
