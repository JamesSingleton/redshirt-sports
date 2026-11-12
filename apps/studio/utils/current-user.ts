import type { CurrentUser, SanityClient } from "sanity";

export function isAdministrator(
  user: Pick<CurrentUser, "roles"> | null | undefined,
): boolean {
  return Boolean(user?.roles?.some(({ name }) => name === "administrator"));
}

/**
 * The author documents for the signed-in user: the one linked to their
 * Studio account, or, until they link it, an active author with exactly
 * their name. Archived authors never match.
 */
export const AUTHOR_FOR_USER_QUERY = `*[
  _type == "author" &&
  !(_id in path("drafts.**")) &&
  archived != true &&
  (studioUserId == $userId || (!defined(*[_type == "author" && studioUserId == $userId][0]) && lower(name) == lower($name)))
][0]._id`;

/** References for an article's `authors`, starting with the signed-in user. */
export async function authorsForUser(
  user: Pick<CurrentUser, "id" | "name"> | null | undefined,
  client: Pick<SanityClient, "fetch">,
): Promise<Array<{ _type: "reference"; _ref: string; _key: string }>> {
  if (!user?.id) return [];
  const authorId = await client.fetch<string | null>(AUTHOR_FOR_USER_QUERY, {
    userId: user.id,
    name: user.name?.trim() ?? "",
  });
  return authorId
    ? [{ _type: "reference", _ref: authorId, _key: authorId.slice(0, 12) }]
    : [];
}
