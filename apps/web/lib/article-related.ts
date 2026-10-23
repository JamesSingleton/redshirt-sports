import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";

import { postArchiveKicker } from "@/lib/news-archive";

type ArticlePost = NonNullable<QueryPostSlugDataResult>;

type RelatedSource = {
  _id: string;
  title: string;
  slug: string | null;
  image?: ArticlePost["image"];
  tagNames?: string[] | null;
  division?: { name?: string | null } | null;
  sportSubgrouping?: { shortName?: string | null; name?: string | null } | null;
};

export type ArticleRelatedPost = {
  _id: string;
  title: string;
  slug: string;
  image?: ArticlePost["image"];
  kicker: string;
};

function divisionLabel(post: RelatedSource): string | null {
  if (post.sportSubgrouping?.shortName) {
    return post.sportSubgrouping.shortName;
  }
  if (post.sportSubgrouping?.name) {
    return post.sportSubgrouping.name;
  }
  return post.division?.name ?? null;
}

function toRelatedPost(post: RelatedSource): ArticleRelatedPost | null {
  if (!post.slug) {
    return null;
  }
  const divisionLabelValue = divisionLabel(post);
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    image: post.image,
    kicker: postArchiveKicker({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      tagNames: post.tagNames,
      divisionLabel: divisionLabelValue,
    }),
  };
}

const DEFAULT_LIMIT = 3;

export function getArticleRelatedPosts(
  post: ArticlePost,
  limit = DEFAULT_LIMIT,
): ArticleRelatedPost[] {
  const extended = post as ArticlePost & {
    upNextInFeed?: RelatedSource | null;
  };

  const seen = new Set<string>();
  const results: ArticleRelatedPost[] = [];

  const add = (source: RelatedSource | null | undefined) => {
    if (!source || seen.has(source._id) || results.length >= limit) {
      return;
    }
    const mapped = toRelatedPost(source);
    if (!mapped) {
      return;
    }
    seen.add(source._id);
    results.push(mapped);
  };

  for (const candidate of extended.relatedPosts ?? []) {
    add(candidate as RelatedSource);
  }

  add(extended.upNextInFeed);

  return results;
}
