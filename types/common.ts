import { Division } from '@/types'
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
  name: string
  shortName?: string
  slug: string
  description: string
  logo?: MainImage
  division: Division
}

export type BreadcrumbProps = {
  title: string
  href: string
}[]

export interface NavProps {
  divisions: Division[]
}

export interface Top25FormProps {
  schools: {
    _id: string
    name: string
    abbreviation: string
    image: any
    conference: {
      name: string
      shortName: string
    }
  }[]
}
