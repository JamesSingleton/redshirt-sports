import type { SanityImageSource } from '@sanity/asset-utils'
import createImageUrlBuilder from '@sanity/image-url'
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from './api'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  fetch: {
    cache: 'force-cache',
  },
})

const imageBuilder = createImageUrlBuilder({
  projectId: projectId,
  dataset: dataset,
})

export const urlFor = (source: SanityImageSource) =>
  imageBuilder.image(source).auto('format').fit('max').format('webp')
