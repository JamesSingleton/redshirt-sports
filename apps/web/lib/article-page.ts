import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";

import { sportNavLabel } from "@/lib/sport-nav";

type ArticlePost = NonNullable<QueryPostSlugDataResult>;

export type ArticleBreadcrumb = {
  title: string;
  href: string;
};

export function divisionNewsSegment(
  division: ArticlePost["division"],
  sportSubgrouping: ArticlePost["sportSubgrouping"],
): { label: string; slug: string } | null {
  if (!division) return null;
  if (division.name === "D1" && sportSubgrouping?.slug) {
    return {
      label: sportSubgrouping.shortName ?? sportSubgrouping.name ?? "D-I",
      slug: sportSubgrouping.slug,
    };
  }
  return { label: division.name, slug: division.slug };
}

export function buildArticleBreadcrumbs(
  post: ArticlePost,
): ArticleBreadcrumb[] {
  const items: ArticleBreadcrumb[] = [];
  const sport = post.sport;
  if (!sport?.slug) {
    return items;
  }

  const sportLabel = sportNavLabel(sport.slug, sport.title ?? sport.slug);
  items.push({
    title: sportLabel,
    href: `/college/${sport.slug}/news`,
  });

  const division = divisionNewsSegment(post.division, post.sportSubgrouping);
  if (division) {
    items.push({
      title: division.label,
      href: `/college/${sport.slug}/news/${division.slug}`,
    });
  }

  const soleConference =
    post.conferences?.length === 1 ? post.conferences[0] : undefined;
  if (soleConference) {
    const conferenceHref = conferenceNewsHref(post, soleConference);
    if (conferenceHref) {
      items.push({
        title: soleConference.shortName ?? soleConference.name,
        href: conferenceHref,
      });
    }
  }

  items.push({
    title: "News",
    href: `/college/${sport.slug}/news`,
  });

  return items;
}

export type ArticleTeamInStory = {
  _id: string;
  slug: string;
  label: string;
  image?: NonNullable<ArticlePost["teams"]>[number]["image"];
};

/** Schools tagged on the post — shown above the article body, not as footer tags. */
export function articleTeamsInStory(post: ArticlePost): ArticleTeamInStory[] {
  const teams: ArticleTeamInStory[] = [];

  for (const team of post.teams ?? []) {
    if (!team.slug) {
      continue;
    }
    const label = [team.shortName ?? team.name, team.nickname]
      .filter(Boolean)
      .join(" ");
    if (!label) {
      continue;
    }
    teams.push({
      _id: team._id,
      slug: team.slug,
      label,
      image: team.image,
    });
  }

  return teams;
}

export function articleKicker(post: ArticlePost): string {
  const parts: string[] = [];
  const division = divisionNewsSegment(post.division, post.sportSubgrouping);
  if (division) {
    parts.push(division.label);
  }
  const typeLabel =
    (post as ArticlePost & { storyType?: string | null }).storyType ??
    post.tags?.[0]?.name;
  if (typeLabel) {
    parts.push(typeLabel);
  }
  return parts.length > 0 ? parts.join(" · ") : "News";
}

export function conferenceNewsHref(
  post: ArticlePost,
  conference: NonNullable<ArticlePost["conferences"]>[number],
): string | null {
  const sportSlug = post.sport?.slug;
  if (!sportSlug) return null;

  const articleSportId = post.sport?._id;
  const matchingAffiliation = conference.sportSubdivisionAffiliations?.find(
    (affiliation) => affiliation.sport._id === articleSportId,
  );
  const divisionPathSegment =
    matchingAffiliation?.subgrouping.slug || conference.division.slug;

  return `/college/${sportSlug}/news/${divisionPathSegment}/${conference.slug}`;
}
