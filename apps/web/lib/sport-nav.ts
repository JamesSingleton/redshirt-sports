/** Nav labels — §32.7, phase1/index.html */
export const SPORT_NAV_LABEL: Record<string, string> = {
  football: "College Football",
  "mens-basketball": "Men's Basketball",
  "womens-basketball": "Women's Basketball",
};

export function sportNavLabel(slug: string, fallbackName: string): string {
  return SPORT_NAV_LABEL[slug] ?? fallbackName;
}

export function sportHubPath(slug: string): string {
  return `/college/${slug}/news`;
}

export function sportRankingsIndexPath(slug: string): string {
  return `/college/${slug}/rankings`;
}

const POLL_NAV_LABEL: Record<string, string> = {
  fcs: "FCS",
  fbs: "FBS",
  d1: "D-I",
  d2: "D-II",
  d3: "D-III",
  naia: "NAIA",
  "mid-major": "Mid-Major",
  "power-conferences": "Power Conferences",
};

export function pollNavLabel(division: string): string {
  return POLL_NAV_LABEL[division] ?? division.toUpperCase();
}

/** A sport's poll as listed on its Sanity `sport` document. */
export type NavPoll = {
  _key: string;
  slug: string;
  label: string | null;
};

/** Nav text for a poll: the editor's label, else the standard short name. */
export function navPollLabel(poll: Pick<NavPoll, "slug" | "label">): string {
  return poll.label?.trim() || pollNavLabel(poll.slug);
}
