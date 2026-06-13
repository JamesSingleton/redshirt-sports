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
        on: ["create", "update"],
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
        on: ["create", "update"],
        filter:
          "(_type == 'post' || _type == 'author' || _type == 'school') && delta::changedAny(slug.current)",
        projection:
          "{_type, 'beforeSlug': before().slug.current, 'slug': after().slug.current}",
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
          "_type == 'post' && (delta::changedAny(body) || (delta::operation() == 'create' && defined(body)))",
        projection: "{_id}",
      },
    }),
    defineDocumentFunction({
      name: "auto-tag",
      src: "./functions/auto-tag",
      memory: 2,
      timeout: 30,
      event: {
        on: ["create", "update"],
        filter:
          "_type == 'post' && (delta::changedAny(body) || (delta::operation() == 'create' && defined(body)))",
        projection: "{_id}",
      },
    }),
    defineSyncTagInvalidateFunction({
      event: {
        resource: {
          id: "8pbt9f8w.production",
          type: "dataset",
        },
      },
      name: "cache-invalidate",
    }),
  ],
});
