/**
 * Next.js cache tags for Sanity post lists.
 *
 * Any GROQ list filtered on `_type == "post"` gets Sanity's type-wide sync
 * tag, so every post publish would expire every page showing such a list.
 * Those lists skip sync tags (`fetchWithoutSyncTags`) and use these narrower
 * tags instead. The `post-cache-tags` Sanity Function expires them when a
 * post is created, edited, or deleted, through the web app's
 * `/api/revalidate-tags`.
 */

/** Pages that show this post in a list (article related/more-from-author lists). */
export function postTag(postId: string) {
  return `post:${postId}`;
}

/** Posts that tag this school (team page news and post count). */
export function postsBySchoolTag(schoolId: string) {
  return `posts:school:${schoolId}`;
}

/** Posts by this author (author page list). */
export function postsByAuthorTag(authorId: string) {
  return `posts:author:${authorId}`;
}

/** Tags to expire after a post with these references changes. */
export function postInvalidationTags({
  postId,
  schoolIds = [],
  authorIds = [],
}: {
  postId: string;
  schoolIds?: readonly (string | null | undefined)[];
  authorIds?: readonly (string | null | undefined)[];
}) {
  const present = (ids: readonly (string | null | undefined)[]) =>
    ids.filter((id): id is string => typeof id === "string" && id !== "");
  return [
    ...new Set([
      postTag(postId),
      ...present(schoolIds).map(postsBySchoolTag),
      ...present(authorIds).map(postsByAuthorTag),
    ]),
  ];
}
