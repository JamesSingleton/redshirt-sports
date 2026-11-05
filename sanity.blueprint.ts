import {
  defineBlueprint,
  defineDocumentFunction,
  defineSyncTagInvalidateFunction,
} from "@sanity/blueprints";

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: "published-at",
      src: "./apps/functions/published-at",
      memory: 1,
      timeout: 10,
      event: {
        on: ["create", "update"],
        filter: "_type == 'post' && !defined(publishedAt)",
        projection: "{_id}",
      },
    }),
    defineDocumentFunction({
      name: "modified-at",
      src: "./apps/functions/modified-at",
      memory: 1,
      timeout: 10,
      event: {
        // Published posts only fire `update` on publish, not draft autosaves.
        // `before().publishedAt` skips the first publish. Watching only title
        // and body means this function's own modifiedAt write can't re-trigger it.
        on: ["update"],
        filter:
          "_type == 'post' && defined(before().publishedAt) && (delta::changedAny(title) || delta::changedAny(body))",
        projection:
          "{_id, publishedAt, 'titleChanged': before().title != after().title, 'beforeText': pt::text(before().body), 'afterText': pt::text(after().body)}",
      },
    }),
    defineDocumentFunction({
      name: "auto-redirect",
      src: "./apps/functions/auto-redirect",
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
      src: "./apps/functions/auto-summary",
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
      src: "./apps/functions/auto-tag",
      memory: 2,
      timeout: 30,
      event: {
        on: ["create", "update"],
        filter:
          "_type == 'post' && (delta::changedAny(body) || (delta::operation() == 'create' && defined(body)))",
        projection: "{_id}",
      },
    }),
    defineDocumentFunction({
      name: "sync-school",
      src: "./apps/functions/sync-school",
      memory: 1,
      timeout: 30,
      event: {
        on: ["create", "update"],
        filter: "_type == 'school'",
        projection:
          "{_id, name, shortName, abbreviation, nickname, image, 'slug': slug.current, top25VotingEligible}",
      },
    }),
    defineSyncTagInvalidateFunction({
      src: "./apps/functions/cache-invalidate",
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
