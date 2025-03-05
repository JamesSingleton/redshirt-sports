import createImageUrlBuilder from '@sanity/image-url'

import { dataset, projectId } from '@/lib/sanity.api'

import type { MainImage } from '@/types'

export const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source: MainImage) => {
  return imageBuilder?.image(source).auto('format').fit('max').ignoreImageParams().crop('entropy')
}
