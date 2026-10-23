/** Stable `name` for article hero shared-element morphs (card → article). */
export function articleHeroTransitionName(slug: string) {
  return `article-hero-${slug}`;
}

/** Stable `name` for team hub logo morphs (rankings → team hub). */
export function teamHubLogoTransitionName(slug: string) {
  return `team-hub-logo-${slug}`;
}
