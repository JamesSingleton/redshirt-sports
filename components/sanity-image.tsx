'use client'

import Image, { type ImageProps } from 'next/image'
import { imageBuilder } from '@/lib/sanity.image'
import { type SanityImageSource } from '@sanity/image-url/lib/types/types'

interface SanityImageProps extends Omit<ImageProps, 'src'> {
  src: SanityImageSource
  quality?: number
}

export default function SanityImage({ quality = 75, src, ...props }: SanityImageProps) {
  const baseURL = 'https://cdn.sanity.io/images/'
  return (
    <Image
      {...props}
      alt={props.alt}
      loader={({ width: srcWidth, ...otherProps }) => {
        let url =
          imageBuilder
            .image(src)
            .width(srcWidth)
            .height(Number(props.height))
            .auto('format')
            .quality(quality)
            .fit('clip')
            .url() ?? ''

        return url
      }}
      src={imageBuilder.image(src).url()?.toString().replace(baseURL, '') ?? ''}
    />
  )
}
