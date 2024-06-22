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

export interface Vote {
  id: number
  userId: string
  // division: 'fbs' | 'fcs' | 'd2' | 'd3'
  week: number
  year: number
  createdAt: Date
  updatedAt: Date
  rank_1: string
  rank_2: string
  rank_3: string
  rank_4: string
  rank_5: string
  rank_6: string
  rank_7: string
  rank_8: string
  rank_9: string
  rank_10: string
  rank_11: string
  rank_12: string
  rank_13: string
  rank_14: string
  rank_15: string
  rank_16: string
  rank_17: string
  rank_18: string
  rank_19: string
  rank_20: string
  rank_21: string
  rank_22: string
  rank_23: string
  rank_24: string
  rank_25: string
}

export interface Top25FormProps {
  schools: {
    _id: string
    name: string
    abbreviation: string
    shortName: string
    image: any
    conference: {
      name: string
      shortName: string
    }
  }[]
  vote?: Vote | undefined
}

export interface Ballot {
  id: number
  userId: string
  division: string
  week: number
  year: number
  createdAt: Date
  teamId: string
  rank: number
  points: number
}
