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
    defineDocumentFunction({
      type: 'sanity.function.document',
      name: 'auto-redirect',
      src: './functions/auto-redirect',
      memory: 2,
      timeout: 30,
      event: {
        on: ['publish'],
        filter: "_type == 'post' && delta::changedAny(slug.current)",
        projection: "{'beforeSlug': before().slug.current, 'slug': after().slug.current}",
      },
    }),
    defineDocumentFunction({
      type: 'sanity.function.document',
      src: './functions/auto-summary',
      memory: 2,
      timeout: 30,
      name: 'auto-summary',
      event: {
        on: ['create', 'update'],
        filter: "_type == 'post' && delta::changedAny(content)",
        projection: '{_id}',
      },
    }),
  ],
})
