/** Public profile URL for authors and staff (phase-1 mock: /people/[slug]). */
export function personHref(slug: string): string {
  return `/people/${slug}`;
}
