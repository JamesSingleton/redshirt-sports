import {
  sportNavConfigs,
  type NavLink,
  type SportNavConfig,
} from "@/components/nav-config";

const SPORT_NEWS_DESCRIPTIONS: Record<string, string> = {
  football:
    "The latest college football news, recruiting, transfer portal, and analysis across all NCAA divisions and the NAIA.",
  "mens-basketball":
    "The latest college men's basketball news, recruiting, transfer portal, and analysis across all NCAA divisions and the NAIA.",
  "womens-basketball":
    "The latest college women's basketball news, recruiting, transfer portal, and analysis across all NCAA divisions and the NAIA.",
};

const DIVISION_NEWS_DESCRIPTIONS: Record<string, string> = {
  fbs: "FBS football news, rankings, scores, and recruiting from the Football Bowl Subdivision.",
  fcs: "FCS football news, rankings, scores, and transfer portal updates from the Football Championship Subdivision.",
  d2: "NCAA Division II sports news, scores, standings, and student-athlete stories.",
  d3: "NCAA Division III sports news, game results, and program updates from across the country.",
  naia: "NAIA sports news, championship coverage, and team updates from the National Association of Intercollegiate Athletics.",
  nccaa:
    "NCCAA sports news, tournament coverage, and program highlights from the National Christian College Athletic Association.",
  "mid-major":
    "Mid-major basketball news, upsets, transfer portal moves, and analysis from conferences like the MWC, A-10, WCC, and MAC.",
  "power-conference":
    "Power conference basketball news, recruiting, rankings, and analysis from the ACC, Big Ten, Big 12, SEC, and Pac-12.",
};

export function getSportNavConfig(slug: string): SportNavConfig | undefined {
  return sportNavConfigs.find((sport) => sport.slug === slug);
}

/** Legacy news routes used descriptive slugs; Sanity uses d2/d3. */
const DIVISION_ROUTE_SLUG_ALIASES: Record<string, string> = {
  "division-ii": "d2",
  "division-iii": "d3",
};

export function resolveDivisionRouteSlug(slug: string): string {
  return DIVISION_ROUTE_SLUG_ALIASES[slug] ?? slug;
}

/** Map college news route divisions to Postgres ranking division slugs. */
export function mapNewsDivisionToRankingDivision(
  sportSlug: string,
  newsDivisionSlug: string,
): string | null {
  if (sportSlug === "football") {
    if (newsDivisionSlug === "fbs" || newsDivisionSlug === "fcs") {
      return newsDivisionSlug;
    }
    return null;
  }

  if (
    sportSlug === "mens-basketball" ||
    sportSlug === "womens-basketball"
  ) {
    if (
      newsDivisionSlug === "division-i" ||
      newsDivisionSlug === "power-conference" ||
      newsDivisionSlug === "mid-major"
    ) {
      return "division-i";
    }
    return null;
  }

  return null;
}

export function getDivisionSlugFromHref(href: string): string {
  return resolveDivisionRouteSlug(href.split("/").pop() ?? href);
}

/** Keep nav-config division order/labels; drop divisions with no published posts. */
export function filterSportDivisionsWithArticles(
  sportConfig: SportNavConfig | undefined,
  divisionSlugs: string[] | null | undefined,
): NavLink[] {
  if (!sportConfig || !divisionSlugs?.length) {
    return [];
  }

  const slugSet = new Set(divisionSlugs.map(resolveDivisionRouteSlug));
  return sportConfig.divisions.filter((division) =>
    slugSet.has(getDivisionSlugFromHref(division.href)),
  );
}

export function getSportNewsDescription(
  sportSlug: string,
  sportTitle: string,
): string {
  return (
    SPORT_NEWS_DESCRIPTIONS[sportSlug] ??
    `The latest college ${sportTitle.toLowerCase()} news, recruiting, transfer portal, and analysis.`
  );
}

export function getDivisionNewsDescription(
  divisionSlug: string,
  divisionLabel: string,
  sportTitle: string,
): string {
  return (
    DIVISION_NEWS_DESCRIPTIONS[divisionSlug] ??
    `The latest ${divisionLabel} ${sportTitle.toLowerCase()} news and analysis.`
  );
}

export const COLLEGE_NEWS_DESCRIPTION =
  "Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting, and in-depth analysis from across the NCAA.";
