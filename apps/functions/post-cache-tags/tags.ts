/**
 * Mirrors `postInvalidationTags` in `packages/sanity/src/cache-tags.ts`, which
 * the web app tags its post lists with. Functions are bundled from this folder
 * alone, so it can't import the workspace package; `tags.test.ts` keeps the
 * two in step.
 */

type Ids = readonly (string | null | undefined)[] | null | undefined;

function present(ids: Ids) {
  return (ids ?? []).filter(
    (id): id is string => typeof id === "string" && id !== "",
  );
}

export type PostCacheTagsEventData = {
  _id: string;
  /** School refs before and after the change (deleted posts have only `before`). */
  teams?: Ids;
  /** Author refs before and after the change. */
  authors?: Ids;
};

export function postCacheTags({ _id, teams, authors }: PostCacheTagsEventData) {
  return [
    ...new Set([
      `post:${_id}`,
      ...present(teams).map((id) => `posts:school:${id}`),
      ...present(authors).map((id) => `posts:author:${id}`),
    ]),
  ];
}
