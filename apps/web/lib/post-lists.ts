import {
  postsByAuthorTag,
  postsBySchoolTag,
  postTag,
} from "@redshirt-sports/sanity/cache-tags";
import {
  type DynamicFetchOptions,
  fetchWithoutSyncTags,
} from "@redshirt-sports/sanity/live";
import {
  postsByAuthor,
  postsBySchoolQuery,
  queryArticleLists,
} from "@redshirt-sports/sanity/queries";
import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import { cacheLife, cacheTag } from "next/cache";

import { CONTENT_CACHE_LIFE } from "@/lib/content-cache-life";

/**
 * Post lists fetched without Sanity's type-wide "any post changed" sync tag
 * and tagged by `@redshirt-sports/sanity/cache-tags` instead, which the
 * `post-cache-tags` Sanity Function expires. Each is its own `"use cache"`
 * boundary, called from a page, never from inside another cache fill.
 *
 * Published entries get no Sanity Live revalidation, so `CONTENT_CACHE_LIFE`
 * is the backup for anything the tags miss (an author or tag renamed, a
 * backdated post).
 */

export type ArticleLists = Awaited<ReturnType<typeof getCachedArticleLists>>;

type ArticleSource = Pick<
  NonNullable<QueryPostSlugDataResult>,
  "_id" | "publishedAt" | "sport" | "conferences" | "tags" | "teams" | "authors"
>;

function ids(items: ReadonlyArray<{ _id: string } | null> | null | undefined) {
  return (items ?? [])
    .map((item) => item?._id)
    .filter((id): id is string => Boolean(id));
}

/** Plain, serializable params for the article lists cache key. */
export function articleListParams(post: ArticleSource) {
  return {
    postId: post._id,
    publishedAt: post.publishedAt ?? null,
    sportId: post.sport?._id ?? null,
    conferenceIds: ids(post.conferences),
    tagIds: ids(post.tags),
    teamIds: ids(post.teams),
    authorIds: ids(post.authors),
  };
}

/**
 * Related, up-next, and more-from-author lists for an article. They hold only
 * posts published before it, so a new post never changes them; the entry is
 * tagged by each listed post and expires when one of those is edited.
 */
export async function getCachedArticleLists({
  params,
  perspective,
  stega,
}: {
  params: ReturnType<typeof articleListParams>;
} & DynamicFetchOptions) {
  "use cache";
  const { data } = await fetchWithoutSyncTags({
    query: queryArticleLists,
    params,
    perspective,
    stega,
  });
  const lists = data ?? {
    relatedPosts: [],
    upNextInFeed: null,
    moreFromAuthor: [],
  };
  if (perspective === "published" && !stega) {
    cacheLife(CONTENT_CACHE_LIFE);
    const tags = new Set(
      [
        ...lists.relatedPosts.map((post) => post._id),
        lists.upNextInFeed?._id,
        ...lists.moreFromAuthor.map((post) => post._id),
      ]
        .filter((id): id is string => Boolean(id))
        .map(postTag),
    );
    if (tags.size > 0) cacheTag(...tags);
  }
  return lists;
}

/** A school's newest posts and total post count (team page news and eligibility). */
export async function getCachedSchoolPosts({
  schoolId,
  from,
  to,
  perspective,
  stega,
}: {
  schoolId: string;
  from: number;
  to: number;
} & DynamicFetchOptions) {
  "use cache";
  const { data } = await fetchWithoutSyncTags({
    query: postsBySchoolQuery,
    params: { schoolId, from, to },
    perspective,
    stega,
  });
  if (perspective === "published" && !stega) {
    cacheLife(CONTENT_CACHE_LIFE);
    cacheTag(postsBySchoolTag(schoolId));
  }
  return data;
}

/** An author's posts, newest first, for one page of their profile. */
export async function getCachedAuthorPosts({
  slug,
  from,
  to,
  perspective,
  stega,
}: {
  slug: string;
  from: number;
  to: number;
} & DynamicFetchOptions) {
  "use cache";
  const { data } = await fetchWithoutSyncTags({
    query: postsByAuthor,
    params: { slug, from, to },
    perspective,
    stega,
  });
  if (perspective === "published" && !stega) {
    cacheLife(CONTENT_CACHE_LIFE);
    if (data?.authorId) cacheTag(postsByAuthorTag(data.authorId));
  }
  return data;
}
