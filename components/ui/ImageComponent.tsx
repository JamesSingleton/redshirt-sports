'use client'

import { SanityImage } from 'sanity-image'

import { projectId, dataset } from '@lib/sanity.api'

const ImageComponent = ({
  image,
  alt,
  className,
  width,
  height,
  mode = 'cover',
  loading = 'lazy',
}: {
  image: any
  alt?: string
  className?: string
  width: number
  height: number
  mode?: 'cover' | 'contain'
  loading?: 'lazy' | 'eager'
}) => {
  return (
    <SanityImage
      key={image.asset._ref ?? image.asset._id}
      id={image.asset._ref ?? image.asset._id}
      alt={alt ?? image.caption}
      width={width}
      height={height}
      mode={mode}
      className={className}
      dataset={dataset}
      projectId={projectId}
      hotspot={image.hotspot}
      title={alt ?? image.caption}
      loading={loading}
    />
  )
}

export default ImageComponent
