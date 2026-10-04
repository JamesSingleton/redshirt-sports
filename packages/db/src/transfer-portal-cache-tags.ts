/** Cache tags for Next.js `"use cache"` transfer portal data on the public web app. */

export const PORTAL_CACHE_TAG = "transfer-portal";

export function portalWireTag(sport: string, year: number) {
  return `transfer-portal:${sport}:${year}`;
}

export function portalPlayerTag(slug: string) {
  return `transfer-portal:player:${slug}`;
}

export function portalSchoolTag(schoolId: string) {
  return `transfer-portal:school:${schoolId}`;
}
