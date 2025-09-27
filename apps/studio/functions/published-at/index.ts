import { createClient } from '@sanity/client'
import { documentEventHandler } from '@sanity/functions'

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: '2025-07-17',
    useCdn: false,
  })
  const { data } = event
  const { local } = context // local is true when running locally

  try {
    const publishedAtDate = new Date().toISOString()
    const result = await client
      .patch(data._id)
      .setIfMissing({
        publishedAt: publishedAtDate,
      })
      .commit({ dryRun: local })
    console.log(
      local
        ? `(LOCAL TEST MODE - Content Lake not updated) Set publishedAt timestamp for document (${data._id}): ${publishedAtDate}  `
        : `Set publishedAt timestamp for document (${data._id}): ${publishedAtDate}`,
      result,
    )
  } catch (error) {
    console.error('Error setting publishedAt timestamp:', error)
  }
})
