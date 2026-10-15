/**
 * Public URL builders from blueprint §17.
 * Package name in the blueprint is `@rs/seo/urls`. Here it is `@redshirt-sports/seo/urls`.
 *
 * There is no `level()` helper. `/college` is not a page and must 404.
 * These builders describe the target paths. Live routes move to them in a later PR.
 */
export const LEVELS = {
  college: { path: "college", label: "College" },
} as const;

export type Level = keyof typeof LEVELS;

export const SPORTS = {
  cfb: {
    level: "college",
    path: "football",
    label: "College Football",
    teamPath: "football",
    divisions: ["fbs", "fcs", "d2", "d3", "naia"],
  },
  mbb: {
    level: "college",
    path: "mens-basketball",
    label: "Men's College Basketball",
    teamPath: "mens-basketball",
    divisions: ["d1", "d2", "d3"],
  },
  wbb: {
    level: "college",
    path: "womens-basketball",
    label: "Women's College Basketball",
    teamPath: "womens-basketball",
    divisions: ["d1", "d2", "d3"],
  },
} as const satisfies Record<
  string,
  {
    level: Level;
    path: string;
    label: string;
    teamPath: string;
    divisions: readonly string[];
  }
>;

export type Sport = keyof typeof SPORTS;

export const sportBase = (sport: Sport) =>
  `/${LEVELS[SPORTS[sport].level].path}/${SPORTS[sport].path}`;

type Week = number | "preseason" | "final";

const weekSeg = (week: Week) =>
  typeof week === "number" ? `week-${week}` : week;

/** Page 1 has no query. Later pages are `?page=n`. */
export function pageHref(pathname: string, page: number) {
  return page > 1 ? `${pathname}?page=${page}` : pathname;
}

const pageQuery = (page?: number) => (page && page > 1 ? `?page=${page}` : "");

/**
 * Vote site origin. Set `NEXT_PUBLIC_VOTE_URL` (for example `http://localhost:3002`).
 * The production host is only the fallback when that variable is unset.
 */
export function voteOrigin(
  configured: string | undefined = process.env.NEXT_PUBLIC_VOTE_URL,
) {
  const raw = configured?.trim().replace(/\/$/, "");
  if (!raw) return "https://vote.redshirtsports.com";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw}`;
}

export const urls = {
  levelNews: (level: Level, page?: number) =>
    pageHref(`/${LEVELS[level].path}/news`, page ?? 1),
  sport: (sport: Sport) => sportBase(sport),
  division: (sport: Sport, division: string) =>
    `${sportBase(sport)}/${division}`,
  news: (sport: Sport, page?: number) =>
    `${sportBase(sport)}/news${pageQuery(page)}`,
  divisionNews: (sport: Sport, division: string, page?: number) =>
    `${sportBase(sport)}/${division}/news${pageQuery(page)}`,
  article: (post: { primarySport: Sport; slug: string }) =>
    `${sportBase(post.primarySport)}/news/${post.slug}`,
  team: (schoolSlug: string) => `/teams/${schoolSlug}`,
  teamSport: (
    schoolSlug: string,
    sport: Sport,
    tab?: "news" | "rankings",
    page?: number,
  ) =>
    `/teams/${schoolSlug}/${SPORTS[sport].teamPath}${tab ? `/${tab}` : ""}${pageQuery(page)}`,
  teamNews: (schoolSlug: string, page?: number) =>
    `/teams/${schoolSlug}/news${pageQuery(page)}`,
  person: (slug: string, page?: number) => `/people/${slug}${pageQuery(page)}`,
  pollCurrent: (sport: Sport, division: string) =>
    `${sportBase(sport)}/rankings/${division}`,
  pollWeek: (sport: Sport, division: string, year: number, week: Week) =>
    `${sportBase(sport)}/rankings/${division}/${year}/${weekSeg(week)}`,
  ballots: (sport: Sport, division: string, year: number, week: Week) =>
    `${urls.pollWeek(sport, division, year, week)}/ballots`,
  ballot: (
    sport: Sport,
    division: string,
    year: number,
    week: Week,
    voter: string,
  ) => `${urls.ballots(sport, division, year, week)}/${voter}`,
  ballotsByVoter: (
    sport: Sport,
    division: string,
    year: number,
    week: Week,
    page?: number,
  ) =>
    `${urls.ballots(sport, division, year, week)}/by-voter${pageQuery(page)}`,
  voterPanel: (sport: Sport, division: string) =>
    `${sportBase(sport)}/rankings/${division}/voters`,
  pollHistory: (sport: Sport, division: string, year?: number) =>
    `${sportBase(sport)}/rankings/${division}/history${year ? `/${year}` : ""}`,
  methodology: (sport: Sport) => `${sportBase(sport)}/rankings/methodology`,
  portal: (sport: Sport, page?: number) =>
    `${sportBase(sport)}/transfer-portal${pageQuery(page)}`,
  recruiting: (sport: Sport, page?: number) =>
    `${sportBase(sport)}/recruiting${pageQuery(page)}`,
  bracketDivision: (sport: Sport, division: string) =>
    `${sportBase(sport)}/bracket-challenge/${division}`,
  bracketEvent: (sport: Sport, division: string, year: number) =>
    `${sportBase(sport)}/bracket-challenge/${division}/${year}`,
  bracketEntry: (sport: Sport, division: string, year: number, id: string) =>
    `${urls.bracketEvent(sport, division, year)}/entries/${id}`,
  bracketJoin: (sport: Sport, division: string, year: number, code: string) =>
    `${urls.bracketEvent(sport, division, year)}/join/${code}`,
  voteInvite: (token: string) => `${voteOrigin()}/invite/${token}`,
  voteBallot: (poll: string, year: number, week: Week) =>
    `${voteOrigin()}/ballot/${poll}/${year}/${weekSeg(week)}`,
};
