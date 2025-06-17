import createImageUrlBuilder from '@sanity/image-url'
import { getImageDimensions } from '@sanity/asset-utils'
import { Image as SanityImage, type ImageProps as NextImageProps } from 'next-sanity/image'
import { cn } from '@workspace/ui/lib/utils'

import { projectId, dataset } from '@/lib/sanity/api'
import { urlFor } from '@/lib/sanity/client'

type ImageProps = {
  asset: SanityImageProps
  alt?: string
} & Omit<NextImageProps, 'alt' | 'src'>

const imageBuilder = createImageUrlBuilder({
  projectId,
  dataset,
})

export const urlForImage = (source: Parameters<(typeof imageBuilder)['image']>[0]) =>
  imageBuilder.image(source)

function getBlurDataURL(asset: any) {
  if (asset?.blurData) {
    return {
      blurDataURL: asset.blurData,
      placeholder: 'blur' as const,
    }
  }
  return {}
}

export function Image({
  asset,
  alt,
  width,
  height,
  className,
  quality = 75,
  fill,
  ...props
}: ImageProps) {
  if (!asset?.asset) return null
  const dimensions = getImageDimensions(asset.asset)
  const url = urlFor({ ...asset, _id: asset?.asset?._ref })
    .size(Number(width ?? dimensions.width), Number(height ?? dimensions.height))
    .dpr(2)
    .auto('format')
    .quality(Number(quality))
    .url()

  const imageProps = {
    alt: alt ?? asset.alt ?? 'Image',
    'aria-label': alt ?? asset.alt ?? 'Image',
    src: url,
    className: cn(className),
    // Optimize image sizes for performance and LCP
    // Use smaller percentages to reduce initial load size while maintaining quality
    // Order from smallest to largest breakpoint for better browser parsing
    // Define responsive image sizes for optimal loading:
    // - Mobile (<640px): Image takes up 80% of viewport width
    // - Tablet (<768px): Image takes up 50% of viewport width
    // - Small desktop (<1200px): Image takes up 33% of viewport width
    // - Large desktop (>1200px): Image takes up 25% of viewport width
    sizes: '(max-width: 640px) 75vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw',
    ...getBlurDataURL(asset),
    ...props,
  }

  if (!fill) {
    return (
      <SanityImage
        {...imageProps}
        width={width ?? dimensions.width}
        height={height ?? dimensions.height}
      />
    )
  }

  return <SanityImage {...imageProps} fill={fill} />
}
