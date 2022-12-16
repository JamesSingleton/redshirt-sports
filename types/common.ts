import type { PropsWithChildren } from 'react'

export type WithChildren<T = {}> = T & PropsWithChildren<{}>

export type WithClassName<T = {}> = T & {
  className?: string
}

export interface PrivacyPolicy {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  body: any[]
}
