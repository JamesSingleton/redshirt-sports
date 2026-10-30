import type {
  NewsFilterConference,
  NewsFilterDivision,
} from "@/components/news/news-archive-filters";

type NavSport = {
  slug: string;
  groupings?: Array<{
    slug?: string | null;
    name?: string | null;
    conferences?: Array<{
      slug?: string | null;
      name?: string | null;
      shortName?: string | null;
    }> | null;
  } | null> | null;
};

export function buildSportNewsFilterOptions(
  sportSlug: string,
  navigation: NavSport[] | null | undefined,
): { divisions: NewsFilterDivision[]; conferences: NewsFilterConference[] } {
  const sport = navigation?.find((entry) => entry.slug === sportSlug);
  if (!sport?.groupings) {
    return { divisions: [], conferences: [] };
  }

  const divisions: NewsFilterDivision[] = [];
  const conferences: NewsFilterConference[] = [];

  for (const grouping of sport.groupings) {
    if (!grouping?.slug) continue;
    divisions.push({
      slug: grouping.slug,
      name: grouping.name ?? grouping.slug,
    });
    for (const conference of grouping.conferences ?? []) {
      if (!conference?.slug) continue;
      conferences.push({
        slug: conference.slug,
        name: conference.shortName ?? conference.name ?? conference.slug,
        divisionSlug: grouping.slug,
        sportSlug,
      });
    }
  }

  return { divisions, conferences };
}

export function getDivisionConferences(
  conferences: NewsFilterConference[],
  divisionSlug: string,
): NewsFilterConference[] {
  return conferences.filter((c) => c.divisionSlug === divisionSlug);
}
