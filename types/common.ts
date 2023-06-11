import type { PropsWithChildren } from 'react'
import type { ImageMetadata, ImageCrop, ImageHotspot } from 'sanity'

export type WithChildren<T = {}> = T & PropsWithChildren<{}>

export type WithClassName<T = {}> = T & {
  className?: string
}

export type MainImage<T = {}> = T & {
  asset: {
    _id: string
    _type: 'sanity.imageAsset'
    metadata: ImageMetadata
    url: string
  }
  attribution: string
  caption: string
  crop: ImageCrop
  hotspot: ImageHotspot
}

export type Conference = {
  _id: string
  title: string
  pageHeader?: string
  subtitle?: string
  slug: string
  description: string
  image?: MainImage
  parent: Conference
}
