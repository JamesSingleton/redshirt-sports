import createImageUrlBuilder from '@sanity/image-url'

import { dataset, projectId } from '@lib/sanity.api'

import type { MainImage } from '@types'

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source: MainImage) => {
  // if (!source?.asset?._ref) {
  //   return undefined
  // }

  return imageBuilder?.image(source).auto('format').fit('max')
}
