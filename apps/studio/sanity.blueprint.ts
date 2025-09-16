// Add this to the `resources` array in your blueprint configuraiton
import { defineBlueprint, defineDocumentFunction } from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      type: 'sanity.function.document',
      name: 'published-at',
      src: './functions/published-at',
      memory: 1,
      timeout: 10,
      event: {
        on: ['publish'],
        filter: "_type == 'post' && !defined(publishedAt)",
        projection: '{_id}',
      },
    }),
  ],
})
