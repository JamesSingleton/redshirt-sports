import type { PublishedPlayerDoc } from "./published";
import type { WireConference, WireLevel, WireSchool } from "./wire";

/**
 * One player's public page: the published doc plus the schools, levels, and
 * conferences it names. Built when the page is cached.
 */
export interface PortalPlayerData {
  doc: PublishedPlayerDoc;
  /** False until the player has committed somewhere: the page is `noindex`. */
  indexable: boolean;
  publishedAt: string;
  schools: Record<string, WireSchool>;
  levels: Record<string, WireLevel>;
  conferences: Record<string, WireConference>;
  /**
   * Players merged into this one, oldest id first. Articles tagged with any of
   * them belong on this page.
   */
  mergedIds: number[];
}

/** What `/players/[slugId]` resolves to. */
export type PortalPlayerPage =
  | { kind: "player"; data: PortalPlayerData }
  /** A merged player: send the visitor to the survivor's page. */
  | { kind: "redirect"; id: number; slug: string };

/** The school, level, and conference ids a player doc names. */
export function playerReferences(doc: PublishedPlayerDoc) {
  const schools = new Set<string>();
  const levels = new Set<string>();
  const conferences = new Set<string>();
  const school = (place: { schoolId?: string } | undefined) => {
    if (place?.schoolId) schools.add(place.schoolId);
  };
  for (const sport of doc.sports) {
    sport.enrollments.forEach(school);
    for (const recruitment of sport.recruitments) {
      recruitment.events.forEach(school);
      recruitment.offers.forEach(school);
      for (const place of [recruitment.origin, recruitment.destination]) {
        if (!place) continue;
        school(place);
        if (place.divisionId) levels.add(place.divisionId);
        if (place.subdivisionId) levels.add(place.subdivisionId);
        if (place.conferenceId) conferences.add(place.conferenceId);
      }
    }
  }
  return { schools, levels, conferences };
}
