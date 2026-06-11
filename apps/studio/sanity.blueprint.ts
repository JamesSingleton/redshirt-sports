import {
  defineBlueprint,
  defineDocumentFunction,
  defineSyncTagInvalidateFunction,
} from "@sanity/blueprints";

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: "published-at",
      src: "./functions/published-at",
      memory: 1,
      timeout: 10,
      event: {
        on: ["publish"],
        filter: "_type == 'post' && !defined(publishedAt)",
        projection: "{_id}",
      },
    }),
    defineDocumentFunction({
      name: "auto-redirect",
      src: "./functions/auto-redirect",
      memory: 2,
      timeout: 30,
      event: {
        on: ["publish"],
        filter: "_type == 'post' && delta::changedAny(slug.current)",
        projection:
          "{'beforeSlug': before().slug.current, 'slug': after().slug.current}",
      },
    }),
    defineDocumentFunction({
      src: "./functions/auto-summary",
      memory: 2,
      timeout: 30,
      name: "auto-summary",
      event: {
        on: ["create", "update"],
        filter:
          "_type == 'post' && (delta::changedAny(content) || delta::operation() == 'create')",
        projection: "{_id}",
      },
    }),
    defineSyncTagInvalidateFunction({ name: "cache-invalidate" }),
    // defineSyncTagInvalidateFunction({
    //   name: "cache-invalidate",
    //   event: {
    //     resource: {
    //       type: 'dataset',
    //       id: `${process.env.SANITY_STUDIO_PROJECT_ID}.${process.env.SANITY_STUDIO_DATASET}`
    //     }
    //   }
    // })
  ],
});
