/**
 * URL segment resolution for /college/[sport]/news/[[...slug]].
 *
 * Content model:
 * - governingBody (NCAA, NAIA, …) → classification (NCAA D1, NAIA, d2, …)
 * - NCAA D1 posts may also set sportSubgrouping (fbs, fcs, mid-major)
 * - Other classifications (NAIA, swimming D1-only) use the classification slug alone
 */

/** NCAA Division I classification slugs (not subgroupings like fbs/fcs). */
export function isD1ClassificationSlug(slug: string): boolean {
  const lower = slug.toLowerCase();
  return lower === "d1" || lower === "division-i";
}

export function isBlockedNewsSegment(slug: string): boolean {
  return isD1ClassificationSlug(slug);
}

export type NewsRouteConference = {
  slug: string | null;
  primaryClassification: string | null;
  subgroupings: Array<{
    sport: string | null;
    subgrouping: string | null;
  }> | null;
};

type ConferenceAffiliation = {
  sport?: { _id?: string; slug?: string } | string | null;
  subgrouping?: { slug?: string | null } | string | null;
};

export type ConferenceForNewsPath = {
  slug?: string | null;
  primaryClassification?:
    | string
    | null
    | { slug?: string | null; shortName?: string | null };
  division?: { slug?: string | null } | null;
  sportSubdivisionAffiliations?: ConferenceAffiliation[] | null;
  subgroupings?: NewsRouteConference["subgroupings"];
};

function affiliationMatchesSport(
  sport: ConferenceAffiliation["sport"],
  sportSlug: string,
  sportId?: string,
): boolean {
  if (!sport) return false;
  if (typeof sport === "string") return sport === sportSlug;
  if (sport.slug === sportSlug) return true;
  if (sportId && sport._id === sportId) return true;
  return false;
}

function subgroupingSlugFromAffiliation(
  affiliation: ConferenceAffiliation,
): string | null {
  const subgrouping = affiliation.subgrouping;
  if (!subgrouping) return null;
  if (typeof subgrouping === "string") return subgrouping;
  return subgrouping.slug ?? null;
}

/**
 * URL segment for a conference badge or /news/[segment]/[conference] page.
 * Uses the conference's sport-specific subgrouping affiliation, else primaryClassification.
 * When primary is NCAA D1 (d1) and the article has a sportSubgrouping (e.g. FCS), uses that
 * subgrouping slug so D1 conferences link to /news/fcs/... not /news/d1/...
 */
export function resolveConferenceNewsPathSegment(
  conference: ConferenceForNewsPath,
  options: {
    sportSlug: string;
    sportId?: string;
    /** Article sportSubgrouping slug — used when conference primary is d1. */
    articleSportSubgroupingSlug?: string | null;
  },
): string | null {
  const { sportSlug, sportId, articleSportSubgroupingSlug } = options;

  for (const affiliation of conference.sportSubdivisionAffiliations ?? []) {
    if (!affiliationMatchesSport(affiliation.sport, sportSlug, sportId)) continue;
    const subgroupingSlug = subgroupingSlugFromAffiliation(affiliation);
    if (subgroupingSlug) return subgroupingSlug;
  }

  if (conference.subgroupings?.length) {
    const match = conference.subgroupings.find((sg) => sg.sport === sportSlug);
    if (match?.subgrouping) return match.subgrouping;
  }

  const primary =
    typeof conference.primaryClassification === "string"
      ? conference.primaryClassification
      : conference.primaryClassification?.slug;

  if (primary) {
    if (
      isD1ClassificationSlug(primary) &&
      articleSportSubgroupingSlug &&
      !isD1ClassificationSlug(articleSportSubgroupingSlug)
    ) {
      return articleSportSubgroupingSlug;
    }
    return primary;
  }

  return conference.division?.slug ?? null;
}

export type NewsRouteSlugPost = {
  sportSubgrouping: string | null;
  classification: string | null;
  conferences: NewsRouteConference[] | null;
};

/**
 * Resolves the first URL path segment after /news/ for a post.
 * When sportUsesSubgroupings is true (football, basketball), bare "d1" is omitted
 * in favor of sportSubgrouping slugs on posts that have them.
 */
export function resolveNewsRouteSegment(
  sportSubgrouping: string | null | undefined,
  classification: string | null | undefined,
  sportUsesSubgroupings: boolean,
): string | null {
  if (sportSubgrouping) return sportSubgrouping;
  if (!classification) return null;
  if (isD1ClassificationSlug(classification) && sportUsesSubgroupings) return null;
  return classification;
}

export function conferenceMatchesNewsSegment(
  conference: NewsRouteConference,
  sport: string,
  segment: string,
): boolean {
  const hasSubgroupingAffiliation = conference.subgroupings?.some(
    (sg) => sg.sport === sport && sg.subgrouping === segment,
  );

  if (hasSubgroupingAffiliation) return true;

  return (
    conference.primaryClassification === segment && conference.slug != null
  );
}

export function collectNewsRouteSlugs(
  posts: NewsRouteSlugPost[],
  sport: string,
  sportUsesSubgroupings: boolean,
): { slug: string[] }[] {
  const seen = new Set<string>();
  const slugs: { slug: string[] }[] = [{ slug: [] }];

  for (const post of posts) {
    const segment = resolveNewsRouteSegment(
      post.sportSubgrouping,
      post.classification,
      sportUsesSubgroupings,
    );
    if (!segment) continue;

    if (!seen.has(segment)) {
      seen.add(segment);
      slugs.push({ slug: [segment] });
    }

    for (const conference of post.conferences ?? []) {
      if (!conference?.slug) continue;

      const conferenceSegment = resolveConferenceNewsPathSegment(conference, {
        sportSlug: sport,
      });
      if (
        !conferenceSegment ||
        !conferenceMatchesNewsSegment(conference, sport, conferenceSegment)
      ) {
        continue;
      }

      const key = `${conferenceSegment}/${conference.slug}`;
      if (!seen.has(key)) {
        seen.add(key);
        slugs.push({ slug: [conferenceSegment, conference.slug] });
      }
    }
  }

  return slugs;
}
