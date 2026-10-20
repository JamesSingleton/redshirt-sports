/** Nav labels and mega-menu keys — §32.7, phase1/index.html */
export const SPORT_NAV_LABEL: Record<string, string> = {
  football: "College Football",
  "mens-basketball": "Men's Basketball",
  "womens-basketball": "Women's Basketball",
};

export type SportMegaKey = "fb" | "mbb" | "wbb";

export const SPORT_MEGA_KEY: Record<string, SportMegaKey> = {
  football: "fb",
  "mens-basketball": "mbb",
  "womens-basketball": "wbb",
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
