import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, revalidateSecret } from '@lib/sanity.api'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: revalidateSecret ? false : true,
  perspective: 'published',
})
