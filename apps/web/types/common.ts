import { Division } from '@/types'
import type { PropsWithChildren } from 'react'

import type { SanityImageAsset } from '@redshirt-sports/sanity/types'

export type WithChildren<T = {}> = T & PropsWithChildren<{}>

export type WithClassName<T = {}> = T & {
  className?: string
}

export type Maybe<T> = T | null | undefined

export type Conference = {
  _id: string
  name: string
  shortName?: string
  slug: string
  description: string
  logo?: SanityImageAsset
  division: Division
}

export type BreadcrumbProps = {
  title: string
  href: string
}[]

export interface NavProps {
  divisions: Division[]
  latestFCSTop25?: {
    division: string
    week: number
    year: number
  }
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
  // vote?: Vote | undefined
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
