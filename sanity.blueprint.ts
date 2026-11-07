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
        // Only fills an empty excerpt. Regenerating on every body edit
        // republished the post with new text each time, so every edit rewrote
        // every cached page that lists it. Clear the excerpt to regenerate.
        filter:
          "_type == 'post' && !defined(excerpt) && (delta::changedAny(body) || (delta::operation() == 'create' && defined(body)))",
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
        // Only tags an untagged post. The patch writes fresh `_key`s, so even
        // the same tags counted as a change and republished the post.
        filter:
          "_type == 'post' && count(coalesce(tags, [])) == 0 && (delta::changedAny(body) || (delta::operation() == 'create' && defined(body)))",
        projection: "{_id}",
      },
    }),
    defineDocumentFunction({
      name: "post-cache-tags",
      src: "./apps/functions/post-cache-tags",
      memory: 1,
      timeout: 10,
      event: {
        on: ["create", "update", "delete"],
        filter: "_type == 'post'",
        // Plain fields are the post as it is now (the deleted post on
        // delete). before() adds refs a change removed, so dropping a school
        // or author from a post expires that school's or author's list too.
        projection:
          "{_id, 'teams': coalesce(teams[]._ref, []) + coalesce(before().teams[]._ref, []), 'authors': coalesce(authors[]._ref, []) + coalesce(before().authors[]._ref, [])}",
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
