import type { RankingPeriod, Top25RankingsData } from "./nav-types";

export interface NavLink {
  label: string;
  href: string;
}

export interface SportNavConfig {
  label: string;
  slug: string;
  allNewsHref: string;
  divisions: NavLink[];
  /** Fallback ranking links when live DB data is unavailable */
  rankings: NavLink[];
}

export interface DropdownNavConfig {
  label: string;
  items: NavLink[];
}

export interface QuickNavLink extends NavLink {
  badge?: string;
}

/** Top-level Teams link (matches v0 mock header). */
export const teamsNavLink: NavLink = {
  label: "Teams",
  href: "/college/teams",
};

/**
 * Sport mega-dropdown configs — division news + rankings per sport.
 * Phase 7 can swap this array for CMS-driven navigation.
 */
export const sportNavConfigs: SportNavConfig[] = [
  {
    label: "Football",
    slug: "football",
    allNewsHref: "/college/football/news",
    divisions: [
      { label: "Division I – FBS", href: "/college/football/news/fbs" },
      { label: "Division I – FCS", href: "/college/football/news/fcs" },
      {
        label: "Division II",
        href: "/college/football/news/d2",
      },
      {
        label: "Division III",
        href: "/college/football/news/d3",
      },
      { label: "NAIA", href: "/college/football/news/naia" },
      { label: "NCCAA", href: "/college/football/news/nccaa" },
    ],
    rankings: [
      {
        label: "FBS Top 25 Poll",
        href: "/college/football/rankings/fbs/2025/preseason",
      },
      {
        label: "FCS Top 25 Poll",
        href: "/college/football/rankings/fcs/2025/preseason",
      },
    ],
  },
  {
    label: "Men's Basketball",
    slug: "mens-basketball",
    allNewsHref: "/college/mens-basketball/news",
    divisions: [
      {
        label: "Division I – Power Conference",
        href: "/college/mens-basketball/news/power-conference",
      },
      {
        label: "Division I – Mid-Major",
        href: "/college/mens-basketball/news/mid-major",
      },
      {
        label: "Division II",
        href: "/college/mens-basketball/news/d2",
      },
      {
        label: "Division III",
        href: "/college/mens-basketball/news/d3",
      },
      { label: "NAIA", href: "/college/mens-basketball/news/naia" },
      { label: "NCCAA", href: "/college/mens-basketball/news/nccaa" },
    ],
    rankings: [
      {
        label: "Men's Basketball Top 25",
        href: "/college/mens-basketball/rankings/division-i/2025/preseason",
      },
    ],
  },
  {
    label: "Women's Basketball",
    slug: "womens-basketball",
    allNewsHref: "/college/womens-basketball/news",
    divisions: [
      {
        label: "Division I – Power Conference",
        href: "/college/womens-basketball/news/power-conference",
      },
      {
        label: "Division I – Mid-Major",
        href: "/college/womens-basketball/news/mid-major",
      },
      {
        label: "Division II",
        href: "/college/womens-basketball/news/d2",
      },
      {
        label: "Division III",
        href: "/college/womens-basketball/news/d3",
      },
      { label: "NAIA", href: "/college/womens-basketball/news/naia" },
      { label: "NCCAA", href: "/college/womens-basketball/news/nccaa" },
    ],
    rankings: [
      {
        label: "Women's Basketball Top 25",
        href: "/college/womens-basketball/rankings/division-i/2025/preseason",
      },
    ],
  },
];

export const transferPortalNav: DropdownNavConfig = {
  label: "Transfer Portal",
  items: [
    { label: "Transfer Portal News", href: "/transfer-portal/news" },
    {
      label: "NCAA Transfer Portal",
      href: "/transfer-portal/wire/football/2025",
    },
    { label: "Transfer Portal Rankings", href: "/transfer-portal/rankings" },
    {
      label: "Transfer Portal Team Rankings",
      href: "/transfer-portal/team-rankings",
    },
  ],
};

export const recruitingNav: DropdownNavConfig = {
  label: "Recruiting",
  items: [
    { label: "Football Recruiting", href: "/recruiting" },
    { label: "Basketball Recruiting", href: "/recruiting/basketball" },
    { label: "Recruits", href: "/recruiting/players" },
  ],
};

/** Dropdown nav items rendered after sport menus on desktop / mobile. */
export const dropdownNavItems: DropdownNavConfig[] = [
  transferPortalNav,
  recruitingNav,
];

/**
 * Horizontal quick-link pills below the header (v0 megaboard chrome).
 * Shown on the homepage by default; pass links to override per page.
 */
export const quickNavLinks: QuickNavLink[] = [
  { label: "Recruiting Rankings", href: "/recruiting" },
  { label: "CBB Transfer Portal", href: "/transfer-portal/wire/mens-basketball/2025" },
  { label: "Team Rankings", href: "/college/football/rankings/fbs/2025/preseason" },
  { label: "MegaBoard", href: "/" },
  { label: "College News", href: "/college/news" },
];

const divisionDisplayNames: Record<string, string> = {
  fbs: "FBS",
  fcs: "FCS",
  d2: "Division II",
  d3: "Division III",
  naia: "NAIA",
  "power-conference": "Power Conference",
  "mid-major": "Mid-Major",
  "division-i": "Division I",
};

export function getDivisionDisplayName(division: string): string {
  return divisionDisplayNames[division] ?? division;
}

function formatRankingLabel(division: string, sportLabel: string): string {
  const divisionName = divisionDisplayNames[division] ?? division;
  if (sportLabel === "Football") {
    return `${divisionName} Football Rankings`;
  }
  return `${sportLabel} Top 25`;
}

export function buildRankingHref(
  sportSlug: string,
  ranking: RankingPeriod,
): string {
  const week =
    ranking.week === 999 ? "final-rankings" : String(ranking.week);
  return `/college/${sportSlug}/rankings/${ranking.division}/${ranking.year}/${week}`;
}

/** Prefer live ranking periods from Postgres; fall back to static config links. */
export function resolveSportRankings(
  config: SportNavConfig,
  latestRankings: Top25RankingsData,
): NavLink[] {
  const live = latestRankings.find((s) => s.sport === config.slug)?.divisions;
  const periods = live?.filter(
    (r): r is RankingPeriod => r != null && r.division != null,
  );

  if (!periods?.length) {
    return config.rankings;
  }

  return periods.map((ranking) => ({
    label: formatRankingLabel(ranking.division, config.label),
    href: buildRankingHref(config.slug, ranking),
  }));
}

/** Flat link list for mobile accordions (divisions + rankings combined). */
export function flattenSportNavLinks(
  config: SportNavConfig,
  latestRankings: Top25RankingsData,
): NavLink[] {
  return [
    { label: `All ${config.label} News`, href: config.allNewsHref },
    ...config.divisions,
    ...resolveSportRankings(config, latestRankings),
  ];
}
