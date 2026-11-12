export type BallotShareTeam = {
  rank: number;
  name: string;
  /** Short code drawn in place of the logo when the school has none. */
  abbreviation: string;
  logoUrl: string | null;
};

export type BallotShareInput = {
  /** Poll label, e.g. "FCS". */
  poll: string;
  season: number;
  week: number;
  voterName: string;
  voterOutlet: string;
  teams: BallotShareTeam[];
  /** Light-on-dark wordmark drawn in the header; text fallback when null. */
  wordmarkUrl: string | null;
};

/** Printed in the image footer, whatever host served the page. */
export const BALLOT_SHARE_SITE_HOST = "redshirtsports.com";

export function ballotShareTitle({
  poll,
  week,
}: Pick<BallotShareInput, "poll" | "week">): string {
  return week === 0
    ? `${poll} Preseason Top 25 Ballot`
    : `${poll} Top 25 Ballot · Week ${week}`;
}

export function ballotShareFilename({
  poll,
  season,
  week,
}: Pick<BallotShareInput, "poll" | "season" | "week">): string {
  const slug = poll.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `redshirt-sports-${slug}-${season}-week-${week}-ballot.png`;
}

export function buildPostText({
  poll,
  week,
  url,
}: {
  poll: string;
  week: number;
  url: string;
}): string {
  const which = week === 0 ? "preseason" : `Week ${week}`;
  return `My ${which} ${poll} Top 25 ballot for @_redshirtsports is in. Follow the poll: ${url}`;
}

export function xIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}
