import { SITE_URL } from '@lib/constants'

export function removeDoubleSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/')
}

export function getPathFromSlug(slug: string): string {
  let finalSlug = slug

  return removeDoubleSlashes(`/${finalSlug}/`)
}

export function slugToAbsUrl(slug: string): string {
  return `${SITE_URL}${getPathFromSlug(slug)}`
}
