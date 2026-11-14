import {
  POSITIONS_BY_SPORT,
  type PortalPlayerData,
  type PortalWireData,
  type PublishedPlayerDoc,
  type PublishedRecruitment,
  type PublishedWireRow,
  playerPath,
} from "@redshirt-sports/db/portal";
import type { Person, ProfilePage, WithContext } from "schema-dts";

import {
  EMPTY_FILTERS,
  filtersToSearch,
  formatWireDate,
  groupWirePlayers,
  playerName,
  playerOrigin,
  portalSportLabel,
  schoolView,
  type WireFilters,
  type WireSchoolView,
} from "@/components/portal/wire-format";
import { absoluteUrl } from "@/lib/page-json-ld";
import { portalWirePath } from "@/lib/portal-data";
import { sportNavLabel } from "@/lib/sport-nav";

export type PlayerSport = PublishedPlayerDoc["sports"][number];
export type PlayerEvent = PublishedRecruitment["events"][number];
export type PlayerEnrollment = PlayerSport["enrollments"][number];

/** Sports with the most recent portal activity first; sports without any keep their order. */
export function sportsByActivity(doc: PublishedPlayerDoc): PlayerSport[] {
  const latest = (sport: PlayerSport) =>
    sport.recruitments[0] ? Date.parse(sport.recruitments[0].statusAt) : 0;
  return [...doc.sports].sort((a, b) => latest(b) - latest(a));
}

/** The school the player is at now: the enrollment with no end year. */
export function currentEnrollment(sport: PlayerSport) {
  return sport.enrollments.find((enrollment) => !enrollment.endYear) ?? null;
}

/** 2023–25, 2025– while there, or 2024 for one year. */
export function enrollmentYears(enrollment: {
  startYear: number;
  endYear?: number;
}) {
  if (!enrollment.endYear) return `${enrollment.startYear}–`;
  return enrollment.endYear === enrollment.startYear
    ? String(enrollment.startYear)
    : `${enrollment.startYear}–${String(enrollment.endYear).slice(-2)}`;
}

type Schools = Pick<PortalPlayerData, "schools">;

const nameOf = (
  data: Schools,
  place: { schoolId?: string; schoolName?: string } | undefined,
) => schoolView(data, place)?.name ?? "an undisclosed school";

/** One line of portal history. */
export function eventText(data: Schools, event: PlayerEvent) {
  switch (event.type) {
    case "entered":
      return "Entered the transfer portal";
    case "committed":
      return `Committed to ${nameOf(data, event)}`;
    case "decommitted":
      return `Decommitted from ${nameOf(data, event)}`;
    case "signed":
      return `Signed with ${nameOf(data, event)}`;
    case "enrolled":
      return `Enrolled at ${nameOf(data, event)}`;
    case "withdrew":
      return "Withdrew from the transfer portal";
    default:
      return "Offered";
  }
}

export function playerFullName(doc: PublishedPlayerDoc) {
  return playerName(doc);
}

export function playerHometown(doc: PublishedPlayerDoc) {
  return playerOrigin(doc);
}

export function playerPageTitle(
  doc: PublishedPlayerDoc,
  sport: PlayerSport | undefined,
) {
  const name = playerFullName(doc);
  return sport
    ? `${name} ${sportNavLabel(sport.sportSlug, sport.sportSlug)} Transfer Portal Profile`
    : `${name} Transfer Portal Profile`;
}

/**
 * "Jalen Brooks, a QB from Sentinel (Missoula, MT), committed to Idaho from
 * Montana in the 2026 transfer portal." Shared by the metadata and JSON-LD.
 */
export function playerPageDescription(data: PortalPlayerData) {
  const { doc } = data;
  const [sport] = sportsByActivity(doc);
  const name = playerFullName(doc);
  const from = playerHometown(doc);
  const who = [name, sport?.position ? `a ${sport.position}` : null]
    .filter(Boolean)
    .join(", ");
  const intro = from ? `${who} from ${from}` : who;
  const recruitment = sport?.recruitments[0];
  if (!recruitment) {
    return `${intro}: transfer portal history, offers, and college career on Redshirt Sports.`;
  }
  const origin = nameOf(data, recruitment.origin);
  const year = recruitment.cycleYear;
  const verb = MOVE_VERBS[recruitment.status];
  const move =
    recruitment.status === "entered"
      ? `entered the ${year} transfer portal from ${origin}`
      : recruitment.status === "withdrawn"
        ? `withdrew from the ${year} transfer portal and returned to ${origin}`
        : `${verb} ${nameOf(data, recruitment.destination)} from ${origin} in the ${year} transfer portal`;
  return `${intro}, ${move}. Full portal history, offers, and college career.`;
}

const MOVE_VERBS: Record<string, string> = {
  committed: "committed to",
  signed: "signed with",
  enrolled: "enrolled at",
};

/** ProfilePage with the player as a Person: name, hometown, size, schools. */
export function playerJsonLd(
  data: PortalPlayerData,
  path: string,
  breadcrumbs: { name: string; path: string }[],
): WithContext<ProfilePage> {
  const { doc } = data;
  const [sport] = sportsByActivity(doc);
  const url = absoluteUrl(path);
  const current = sport ? currentEnrollment(sport) : null;
  const currentName = current ? schoolView(data, current)?.name : undefined;
  const pastSchools = (sport?.enrollments ?? [])
    .filter((enrollment) => enrollment.endYear)
    .map((enrollment) => schoolView(data, enrollment)?.name)
    .filter((name): name is string => Boolean(name));
  const alumniOf = [
    ...(doc.highSchoolName ? [doc.highSchoolName] : []),
    ...pastSchools,
  ].map((name) => ({ "@type": "EducationalOrganization" as const, name }));
  const town = [doc.hometownCity, doc.hometownState].filter(Boolean).join(", ");

  const person: Person = {
    "@type": "Person",
    "@id": `${url}#person`,
    name: playerFullName(doc),
    givenName: doc.firstName,
    familyName: doc.lastName,
    url,
    ...(town ? { homeLocation: { "@type": "Place", name: town } } : {}),
    ...(sport?.heightIn
      ? {
          height: {
            "@type": "QuantitativeValue",
            value: sport.heightIn,
            unitCode: "INH",
          },
        }
      : {}),
    ...(sport?.weightLb
      ? {
          weight: {
            "@type": "QuantitativeValue",
            value: sport.weightLb,
            unitCode: "LBR",
          },
        }
      : {}),
    ...(sport?.position ? { jobTitle: sport.position } : {}),
    ...(alumniOf.length ? { alumniOf } : {}),
    ...(currentName && sport
      ? {
          memberOf: {
            "@type": "SportsTeam",
            name: `${currentName} ${portalSportLabel(sport.sportSlug)}`,
          },
        }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#webpage`,
    url,
    name: playerPageTitle(doc, sport),
    description: playerPageDescription(data),
    dateModified: data.publishedAt,
    inLanguage: "en-US",
    isPartOf: { "@type": "WebSite", "@id": `${absoluteUrl("/")}#website` },
    mainEntity: person,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    },
  };
}

// ---------- Profile header and modules ----------

type Place = { schoolId?: string; schoolName?: string };

const samePlace = (a: Place | undefined, b: Place | undefined) =>
  Boolean(
    a &&
      b &&
      (a.schoolId
        ? a.schoolId === b.schoolId
        : a.schoolName !== undefined && a.schoolName === b.schoolName),
  );

/** QB → Quarterback, for the sport. */
export function positionLabel(sportSlug: string, code: string | undefined) {
  if (!code) return null;
  return (
    POSITIONS_BY_SPORT[sportSlug]?.find((position) => position.code === code)
      ?.label ?? null
  );
}

/** Plurals that aren't the label plus "s". */
const POSITION_PLURALS: Record<string, string> = {
  Safety: "safeties",
  "Defensive line": "defensive linemen",
  "Interior offensive line": "interior offensive linemen",
  Edge: "edge rushers",
};

/**
 * "safeties", "wide receivers", "point guards": the position spelled out, as
 * a group. Codes can read wrong as words (S → "Ss"), so a code we don't know
 * becomes "S players".
 */
export function positionPlural(sportSlug: string, code: string) {
  const label = positionLabel(sportSlug, code);
  if (!label) return `${code} players`;
  return POSITION_PLURALS[label] ?? `${label.toLowerCase()}s`;
}

export type MoveTarget =
  | { kind: "school"; view: WireSchoolView | null }
  | { kind: "undecided" }
  | { kind: "returning"; name: string };

export interface MoveCard {
  labels: [string, string];
  from: WireSchoolView | null;
  to: MoveTarget;
  status: PublishedRecruitment["status"];
  /** "Committed Oct 12, 2026". */
  statusLine: string;
  /** What the status line doesn't say: when they entered, and the transfer type. */
  details: string[];
}

const STATUS_VERBS: Record<PublishedRecruitment["status"], string> = {
  entered: "Entered",
  committed: "Committed",
  signed: "Signed",
  enrolled: "Enrolled",
  withdrawn: "Withdrew",
};

/** The header's previous school → next school card. */
export function moveCard(
  data: PortalPlayerData,
  recruitment: PublishedRecruitment,
): MoveCard {
  const from = schoolView(data, recruitment.origin);
  const statusLine = `${STATUS_VERBS[recruitment.status]} ${formatWireDate(recruitment.statusAt)}`;
  const details = [
    recruitment.status === "entered"
      ? null
      : `Entered ${formatWireDate(recruitment.enteredAt)}`,
    recruitment.isGradTransfer ? "Graduate transfer" : "Undergraduate transfer",
  ].filter((detail): detail is string => detail !== null);
  const base = { from, status: recruitment.status, statusLine, details };
  if (recruitment.status === "withdrawn") {
    return {
      ...base,
      labels: ["Previous school", "Next school"],
      to: { kind: "returning", name: from?.name ?? "previous school" },
    };
  }
  if (recruitment.status === "entered" || !recruitment.destination) {
    return {
      ...base,
      labels: ["Previous school", "Next school"],
      to: { kind: "undecided" },
    };
  }
  return {
    ...base,
    labels: ["Previous school", "New school"],
    to: { kind: "school", view: schoolView(data, recruitment.destination) },
  };
}

export type JourneyEventKind =
  | "portal"
  | "commit"
  | "decommit"
  | "sign"
  | "enroll"
  | "withdraw";

export interface JourneyEvent {
  id: number;
  kind: JourneyEventKind;
  label: string;
  date: string;
  superseded: boolean;
}

export interface JourneyStop {
  key: string;
  kind: "next" | "school" | "high-school";
  view: WireSchoolView | null;
  name: string;
  line: string | null;
  years: string | null;
  status?: PublishedRecruitment["status"];
  events: JourneyEvent[];
}

const EVENT_KINDS: Partial<Record<PlayerEvent["type"], JourneyEventKind>> = {
  entered: "portal",
  committed: "commit",
  decommitted: "decommit",
  signed: "sign",
  enrolled: "enroll",
  withdrew: "withdraw",
};

/** Commit, sign, and enroll at the school they ended up at: the arrival, not the departure. */
function isArrival(recruitment: PublishedRecruitment, event: PlayerEvent) {
  return (
    !event.superseded &&
    (event.type === "committed" ||
      event.type === "signed" ||
      event.type === "enrolled") &&
    samePlace(event, recruitment.destination)
  );
}

const ARRIVAL_LABELS: Partial<Record<PlayerEvent["type"], string>> = {
  committed: "Committed",
  signed: "Signed",
  enrolled: "Enrolled",
};

function journeyEvent(
  data: Schools,
  event: PlayerEvent,
  arrival: boolean,
): JourneyEvent[] {
  const kind = EVENT_KINDS[event.type];
  if (!kind) return [];
  const label = arrival
    ? (ARRIVAL_LABELS[event.type] as string)
    : kind === "portal"
      ? "Entered portal"
      : kind === "withdraw"
        ? "Withdrew from portal"
        : eventText(data, event);
  return [
    {
      id: event.id,
      kind,
      label,
      date: formatWireDate(event.occurredAt),
      superseded: event.superseded,
    },
  ];
}

/** Moves that took them out of a school: entering, dropped commitments, withdrawing. */
const departureEvents = (data: Schools, recruitment: PublishedRecruitment) =>
  recruitment.events.flatMap((event) =>
    isArrival(recruitment, event) ? [] : journeyEvent(data, event, false),
  );

/** How they got to the school: committed, signed, enrolled. */
const arrivalEvents = (data: Schools, recruitment: PublishedRecruitment) =>
  recruitment.events.flatMap((event) =>
    isArrival(recruitment, event) ? journeyEvent(data, event, true) : [],
  );

/** Whether a recruitment's cycle falls in an enrollment: a stint ending in 2023 is left in the 2024 cycle. */
const leftDuring = (
  recruitment: PublishedRecruitment,
  enrollment: PlayerEnrollment,
) =>
  samePlace(recruitment.origin, enrollment) &&
  recruitment.cycleYear >= enrollment.startYear &&
  (!enrollment.endYear || recruitment.cycleYear <= enrollment.endYear + 1);

/** Whether a recruitment brought them to an enrollment. */
const arrivedAt = (
  recruitment: PublishedRecruitment,
  enrollment: PlayerEnrollment,
) =>
  recruitment.status === "enrolled" &&
  samePlace(recruitment.destination, enrollment) &&
  Math.abs(enrollment.startYear - recruitment.cycleYear) <= 1;

/**
 * Every stop, newest first: the school they're headed to (or "Undecided"),
 * then each college. A school lists how they arrived (committed, signed,
 * enrolled) and how they left (entered the portal, dropped commitments,
 * withdrew), then high school closes the list.
 */
export function journeyStops(
  data: PortalPlayerData,
  sport: PlayerSport,
): JourneyStop[] {
  const stops: JourneyStop[] = [];
  const latest = sport.recruitments[0];
  if (latest?.status === "entered") {
    stops.push({
      key: "next",
      kind: "next",
      view: null,
      name: "Undecided",
      line: `In the portal since ${formatWireDate(latest.enteredAt)} · no commitment reported`,
      years: null,
      status: "entered",
      events: [],
    });
  } else if (
    latest &&
    (latest.status === "committed" || latest.status === "signed") &&
    latest.destination
  ) {
    const view = schoolView(data, latest.destination);
    stops.push({
      key: "next",
      kind: "next",
      view,
      name: view?.name ?? "Undisclosed school",
      line: "Next school",
      years: `${latest.cycleYear}–`,
      status: latest.status,
      events: arrivalEvents(data, latest),
    });
  }

  for (const enrollment of [...sport.enrollments].reverse()) {
    const view = schoolView(data, enrollment);
    // Oldest first within the stop, so it reads as a story.
    const arrived = sport.recruitments
      .filter((recruitment) => arrivedAt(recruitment, enrollment))
      .reverse();
    const left = sport.recruitments
      .filter((recruitment) => leftDuring(recruitment, enrollment))
      .reverse();
    stops.push({
      key: `${enrollment.startYear}-${view?.key ?? "school"}`,
      kind: "school",
      view,
      name: view?.name ?? "Undisclosed school",
      line: null,
      years: enrollmentYears(enrollment),
      events: [
        ...arrived.flatMap((recruitment) => arrivalEvents(data, recruitment)),
        ...left.flatMap((recruitment) => departureEvents(data, recruitment)),
      ],
    });
  }
  return stops;
}

/** The high school stop at the bottom of the journey, if we know it. */
export function highSchoolStop(doc: PublishedPlayerDoc): JourneyStop | null {
  if (!doc.highSchoolName) return null;
  const town = [doc.hometownCity, doc.hometownState].filter(Boolean).join(", ");
  return {
    key: "high-school",
    kind: "high-school",
    view: null,
    name: doc.highSchoolName,
    line: [town, "high school"].filter(Boolean).join(" · "),
    years: doc.hsGradYear ? `Class of ${doc.hsGradYear}` : null,
    events: [],
  };
}

export interface ProfileOffer {
  key: number;
  view: WireSchoolView | null;
  date: string;
  committed: boolean;
  cycleYear: number;
}

/** Reported offers, newest cycle first, flagging the school they committed to. */
export function profileOffers(
  data: PortalPlayerData,
  sport: PlayerSport,
): ProfileOffer[] {
  return sport.recruitments.flatMap((recruitment) =>
    [...recruitment.offers].reverse().map((offer) => ({
      key: offer.eventId,
      view: schoolView(data, offer),
      date: formatWireDate(offer.occurredAt, true),
      committed:
        recruitment.status !== "entered" &&
        recruitment.status !== "withdrawn" &&
        samePlace(recruitment.destination, offer),
      cycleYear: recruitment.cycleYear,
    })),
  );
}

// ---------- Sidebar ----------

export interface MiniPlayer {
  id: number;
  path: string;
  name: string;
  initials: string;
  /** "WR · S. Illinois → undecided". */
  line: string;
  status: PublishedRecruitment["status"];
}

export interface SideList {
  title: string;
  description: string;
  players: MiniPlayer[];
  /** Said when nobody else matches yet. */
  empty: string;
  link: { label: string; href: string };
}

function miniPlayer(data: PortalWireData, row: PublishedWireRow): MiniPlayer {
  const from = schoolView(data, row.origin)?.name ?? "Undisclosed";
  const to = schoolView(data, row.destination)?.name;
  const move =
    row.status === "withdrawn"
      ? `returning to ${from}`
      : `${from} → ${to ?? "undecided"}`;
  return {
    id: row.playerId,
    path: playerPath({ id: row.playerId, slug: row.slug }),
    name: playerName(row),
    initials: `${row.firstName[0] ?? ""}${row.lastName[0] ?? ""}`.toUpperCase(),
    line: [row.position, move].filter(Boolean).join(" · "),
    status: row.status,
  };
}

const SIDE_LIST_SIZE = 3;

/**
 * The sidebar: others leaving the same school this cycle, and others at the
 * same position. Built from the cycle's cached wire, so it costs no
 * extra query. A list with nobody in it yet still shows, with its tracker link.
 */
export function sideLists(
  wire: PortalWireData,
  doc: PublishedPlayerDoc,
  sport: PlayerSport,
  recruitment: PublishedRecruitment,
  currentCycle: number,
): SideList[] {
  const others = groupWirePlayers(wire.rows)
    .map((player) => player.latest)
    .filter(
      (row, index, rows) =>
        row.playerId !== doc.id &&
        rows.findIndex((other) => other.playerId === row.playerId) === index,
    );
  const base = portalWirePath(
    sport.sportSlug,
    recruitment.cycleYear === currentCycle ? undefined : recruitment.cycleYear,
  );
  const link = (filters: Partial<WireFilters>) =>
    `${base}${filtersToSearch({ ...EMPTY_FILTERS, ...filters })}`;
  const sportLabel = portalSportLabel(sport.sportSlug);
  const lists: SideList[] = [];

  const origin = schoolView(wire, recruitment.origin);
  if (origin) {
    const players = others
      .filter((row) => samePlace(row.origin, recruitment.origin))
      .slice(0, SIDE_LIST_SIZE)
      .map((row) => miniPlayer(wire, row));
    lists.push({
      title: `${origin.name} portal moves`,
      description: `${recruitment.cycleYear} · ${sportLabel}`,
      players,
      empty: `No other ${origin.name} players in the ${recruitment.cycleYear} portal yet.`,
      link: {
        label: `${origin.name} in the tracker`,
        href: link({ school: origin.key }),
      },
    });
  }

  if (sport.position) {
    const players = others
      .filter((row) => row.position === sport.position)
      .slice(0, SIDE_LIST_SIZE)
      .map((row) => miniPlayer(wire, row));
    const group = positionPlural(sport.sportSlug, sport.position);
    lists.push({
      title: `More ${group} in the portal`,
      description: `${sportLabel} · ${recruitment.cycleYear}`,
      players,
      empty: `No other ${group} in the ${recruitment.cycleYear} portal yet.`,
      link: {
        label: "Full portal tracker",
        href: link({ position: sport.position }),
      },
    });
  }
  return lists;
}

/** "1 school", "5 schools". */
export function formatSchoolCount(count: number) {
  return `${count} school${count === 1 ? "" : "s"}`;
}
