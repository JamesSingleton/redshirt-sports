import type { NewsFilterConference } from "@/components/news/news-archive-filters";

type NavSport = {
  slug: string;
  name?: string | null;
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

export type CollegeNewsSport = {
  slug: string;
  name: string;
};

export type CollegeNewsDivisionOption = {
  slug: string;
  name: string;
  sportSlug: string;
};

export function buildCollegeNewsFilterOptions(
  navigation: NavSport[] | null | undefined,
): {
  sports: CollegeNewsSport[];
  divisions: CollegeNewsDivisionOption[];
  conferences: NewsFilterConference[];
} {
  if (!navigation?.length) {
    return { sports: [], divisions: [], conferences: [] };
  }

  const sports: CollegeNewsSport[] = navigation.map((entry) => ({
    slug: entry.slug,
    name: entry.name ?? entry.slug,
  }));

  const divisions: CollegeNewsDivisionOption[] = [];
  const conferences: NewsFilterConference[] = [];

  for (const sport of navigation) {
    for (const grouping of sport.groupings ?? []) {
      if (!grouping?.slug) continue;
      divisions.push({
        slug: grouping.slug,
        name: grouping.name ?? grouping.slug,
        sportSlug: sport.slug,
      });
      for (const conference of grouping.conferences ?? []) {
        if (!conference?.slug) continue;
        conferences.push({
          slug: conference.slug,
          name: conference.shortName ?? conference.name ?? conference.slug,
          divisionSlug: grouping.slug,
          sportSlug: sport.slug,
        });
      }
    }
  }

  return { sports, divisions, conferences };
}
