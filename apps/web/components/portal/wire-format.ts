import type {
  PortalWireData,
  PublishedWireRow,
  WireSchool,
} from "@redshirt-sports/db/portal";

type Place = PublishedWireRow["origin"];

// ---------- Status ----------

/** The status tabs. Committed covers signed and enrolled: all have a new school. */
export const WIRE_STATUS_TABS = [
  { value: "", label: "All" },
  { value: "entered", label: "Entered" },
  { value: "committed", label: "Committed" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export type WireStatusTab = (typeof WIRE_STATUS_TABS)[number]["value"];

export function statusTab(
  status: PublishedWireRow["status"],
): Exclude<WireStatusTab, ""> {
  if (status === "entered" || status === "withdrawn") return status;
  return "committed";
}

/** Where a player stands now. */
export const WIRE_STATUS_LABELS: Record<PublishedWireRow["status"], string> = {
  entered: "Entered",
  committed: "Committed",
  signed: "Signed",
  enrolled: "Enrolled",
  withdrawn: "Withdrawn",
};

/** Status pills: green entered, blue headed somewhere, gray withdrawn. */
export const WIRE_STATUS_CLASSES: Record<PublishedWireRow["status"], string> = {
  entered: "border-up/25 bg-up/12 text-up",
  committed: "border-new/25 bg-new/12 text-new",
  signed: "border-new/25 bg-new/12 text-new",
  enrolled: "border-new/25 bg-new/12 text-new",
  withdrawn: "border-border bg-muted text-muted-foreground",
};

// ---------- Formatting ----------

/** Short sport names for the headline and the sport picker. */
const SPORT_LABELS: Record<string, string> = {
  football: "Football",
  "mens-basketball": "Men's Basketball",
  "womens-basketball": "Women's Basketball",
};

export function portalSportLabel(sport: string) {
  return SPORT_LABELS[sport] ?? sport;
}

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  // One zone on server and browser, so the date never shifts on hydration.
  timeZone: "America/New_York",
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

/** "Oct 12, 2026" (or "Oct 12" when `short`). */
export function formatWireDate(iso: string, short = false) {
  return (short ? shortDate : longDate).format(new Date(iso));
}

/** 77 → 6'5". */
export function formatHeight(inches: number | undefined) {
  if (!inches) return null;
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

/** `6'2" / 215`, `6'2"`, "215", or null. */
export function formatSize(
  row: Pick<PublishedWireRow, "heightIn" | "weightLb">,
) {
  const size = [
    formatHeight(row.heightIn),
    row.weightLb ? String(row.weightLb) : null,
  ].filter(Boolean);
  return size.length ? size.join(" / ") : null;
}

/** RS-JR → R-Jr, GR → Gr. */
export function formatClass(code: string | undefined) {
  if (!code) return null;
  const [first, second] = code.split("-");
  const word = (part: string) => part[0] + part.slice(1).toLowerCase();
  return second ? `R-${word(second)}` : word(first!);
}

export function playerName(
  row: Pick<PublishedWireRow, "firstName" | "lastName" | "suffix">,
) {
  return `${row.firstName} ${row.lastName}${row.suffix ? ` ${row.suffix}` : ""}`;
}

// ---------- Schools and levels ----------

export interface WireSchoolView {
  /** URL-safe: the school's slug, its id, or `name:<text>` for a school we don't have. */
  key: string;
  name: string;
  school: WireSchool | null;
}

/** A school from the wire's dictionary, or a free-text name we don't have a page for. */
export function schoolView(
  data: Pick<PortalWireData, "schools">,
  place: { schoolId?: string; schoolName?: string } | undefined,
): WireSchoolView | null {
  if (!place) return null;
  if (place.schoolId) {
    const school = data.schools[place.schoolId] ?? null;
    return {
      key: school?.slug ?? place.schoolId,
      name: school?.shortName ?? school?.name ?? "Unknown school",
      school,
    };
  }
  if (place.schoolName) {
    return {
      key: `name:${place.schoolName}`,
      name: place.schoolName,
      school: null,
    };
  }
  return null;
}

/** "Sentinel (Missoula, MT)", "Missoula, MT", "Sentinel", or null. */
export function playerOrigin(
  row: Pick<
    PublishedWireRow,
    "highSchoolName" | "hometownCity" | "hometownState"
  >,
) {
  const town = [row.hometownCity, row.hometownState].filter(Boolean).join(", ");
  if (row.highSchoolName && town) return `${row.highSchoolName} (${town})`;
  return row.highSchoolName ?? (town || null);
}

/** A level's id by slug, as the URL names it. */
function levelId(data: PortalWireData, slug: string) {
  return Object.entries(data.levels).find(
    ([, level]) => level.slug === slug,
  )?.[0];
}

const atLevel = (place: Place | undefined, id: string | undefined) =>
  Boolean(id) && (place?.divisionId === id || place?.subdivisionId === id);

export interface WireLevelOption {
  slug: string;
  name: string;
  /** A subdivision, shown under its division. */
  nested: boolean;
}

/**
 * Divisions with their subdivisions under them (NCAA DI → FBS, FCS), each
 * group sorted by name. A subdivision whose division isn't listed stands alone.
 */
export function levelOptions(
  levels: PortalWireData["levels"],
): WireLevelOption[] {
  const entries = Object.entries(levels).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name),
  );
  const top = entries.filter(
    ([, level]) => !level.parentId || !levels[level.parentId],
  );
  return top.flatMap(([id, level]) => [
    { slug: level.slug, name: level.name, nested: false },
    ...entries
      .filter(([, child]) => child.parentId === id)
      .map(([, child]) => ({
        slug: child.slug,
        name: child.name,
        nested: true,
      })),
  ]);
}

export type WireSchoolOption = WireSchoolView;

/**
 * Schools players left or joined this cycle, by name, for the school picker.
 * With a level slug, only schools that were at it when the move was saved.
 */
export function wireSchoolOptions(
  data: PortalWireData,
  level = "",
): WireSchoolOption[] {
  const id = level ? levelId(data, level) : undefined;
  const options = new Map<string, WireSchoolOption>();
  for (const row of data.rows) {
    for (const place of [row.origin, row.destination]) {
      if (!place || (level && !atLevel(place, id))) continue;
      const view = schoolView(data, place);
      if (view && !options.has(view.key)) options.set(view.key, view);
    }
  }
  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- Players ----------

/** A player's trip through this cycle's portal. */
export interface WirePlayer {
  recruitmentId: number;
  latest: PublishedWireRow;
  /** Every move, newest first. */
  moves: PublishedWireRow[];
}

/** Rows (newest first) grouped by player, most recently active player first. */
export function groupWirePlayers(rows: PublishedWireRow[]): WirePlayer[] {
  const players = new Map<number, WirePlayer>();
  for (const row of rows) {
    const player = players.get(row.recruitmentId);
    if (player) player.moves.push(row);
    else {
      players.set(row.recruitmentId, {
        recruitmentId: row.recruitmentId,
        latest: row,
        moves: [row],
      });
    }
  }
  return [...players.values()];
}

/**
 * Under the new school's tile: why it's there, if it needs saying. (A grad
 * transfer's cap sits by their name instead.)
 */
export function chainCaption(row: PublishedWireRow) {
  if (row.status === "withdrawn") return "Returning";
  if (row.status === "signed") return "Signed";
  if (row.status === "enrolled") return "Enrolled";
  return null;
}

// ---------- Filters ----------

export const WIRE_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name" },
] as const;

export type WireSort = (typeof WIRE_SORTS)[number]["value"];

export interface WireFilters {
  /** Player or school name. */
  q: string;
  status: WireStatusTab;
  position: string;
  /** A division or subdivision slug: the player's last or new team is at it. */
  level: string;
  /** A school key from `schoolView`: the player's last or new team. */
  school: string;
  playerClass: string;
  gradTransfer: boolean;
  sort: WireSort;
  page: number;
}

export const EMPTY_FILTERS: WireFilters = {
  q: "",
  status: "",
  position: "",
  level: "",
  school: "",
  playerClass: "",
  gradTransfer: false,
  sort: "newest",
  page: 1,
};

type TextFilter = "q" | "position" | "level" | "school" | "playerClass";

/** URL query keys, so a filtered view can be shared. */
const QUERY_KEYS: Record<TextFilter, string> = {
  q: "q",
  level: "division",
  school: "school",
  position: "pos",
  playerClass: "class",
};

const STATUS_VALUES = new Set<string>(["entered", "committed", "withdrawn"]);
const SORT_VALUES = new Set<string>(["oldest", "name"]);

export function filtersFromSearch(search: string): WireFilters {
  const params = new URLSearchParams(search);
  const filters = { ...EMPTY_FILTERS };
  for (const [key, query] of Object.entries(QUERY_KEYS)) {
    filters[key as TextFilter] = params.get(query)?.slice(0, 120) ?? "";
  }
  const status = params.get("status") ?? "";
  if (STATUS_VALUES.has(status)) filters.status = status as WireStatusTab;
  const sort = params.get("sort") ?? "";
  if (SORT_VALUES.has(sort)) filters.sort = sort as WireSort;
  const page = Number(params.get("page"));
  if (Number.isSafeInteger(page) && page > 1) filters.page = page;
  filters.gradTransfer = params.get("grad") === "1";
  return filters;
}

export function filtersToSearch(filters: WireFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  for (const [key, query] of Object.entries(QUERY_KEYS)) {
    const value = filters[key as TextFilter];
    if (value) params.set(query, value);
  }
  if (filters.gradTransfer) params.set("grad", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Filters that narrow the list (sort and page don't). */
export function activeFilterCount(filters: WireFilters) {
  return [
    filters.q,
    filters.status,
    filters.position,
    filters.level,
    filters.school,
    filters.playerClass,
    filters.gradTransfer,
  ].filter(Boolean).length;
}

/** Whether these filters need every player, not just what the server sent. */
export function needsFullWire(filters: WireFilters) {
  return (
    activeFilterCount(filters) > 0 ||
    filters.sort !== "newest" ||
    filters.page > 1
  );
}

/**
 * Players matching every filter except status, sorted: the base for the
 * status tabs' counts and the stat cards.
 */
export function filterWirePlayers(
  data: PortalWireData,
  filters: WireFilters,
): WirePlayer[] {
  const level = filters.level ? levelId(data, filters.level) : undefined;
  const needle = filters.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const players = groupWirePlayers(data.rows).filter(({ latest }) => {
    if (filters.position && latest.position !== filters.position) return false;
    if (filters.playerClass && latest.classAtEntry !== filters.playerClass) {
      return false;
    }
    if (filters.gradTransfer && !latest.isGradTransfer) return false;
    if (
      filters.level &&
      !atLevel(latest.origin, level) &&
      !atLevel(latest.destination, level)
    ) {
      return false;
    }
    if (
      filters.school &&
      schoolView(data, latest.origin)?.key !== filters.school &&
      schoolView(data, latest.destination)?.key !== filters.school
    ) {
      return false;
    }
    if (needle.length > 0) {
      const haystack = [
        playerName(latest),
        schoolView(data, latest.origin)?.name,
        schoolView(data, latest.destination)?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!needle.every((word) => haystack.includes(word))) return false;
    }
    return true;
  });
  if (filters.sort === "oldest") players.reverse();
  if (filters.sort === "name") {
    players.sort(
      (a, b) =>
        a.latest.lastName.localeCompare(b.latest.lastName) ||
        a.latest.firstName.localeCompare(b.latest.firstName),
    );
  }
  return players;
}

export function byStatus(players: WirePlayer[], status: WireStatusTab) {
  return status
    ? players.filter(({ latest }) => statusTab(latest.status) === status)
    : players;
}

export interface WireCounts {
  all: number;
  entered: number;
  committed: number;
  withdrawn: number;
}

/** How many players stand where: the status tabs and the stat cards. */
export function wireCounts(players: WirePlayer[]): WireCounts {
  const counts = {
    all: players.length,
    entered: 0,
    committed: 0,
    withdrawn: 0,
  };
  for (const { latest } of players) counts[statusTab(latest.status)] += 1;
  return counts;
}

/** 7 of 9 → "78%"; one decimal under 10%; nothing of nothing → "0%". */
export function share(part: number, whole: number) {
  if (whole === 0) return "0%";
  const percent = (part / whole) * 100;
  return `${percent < 10 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%`;
}

/** Page numbers to show around `page`, with null for a gap: 1 … 7 8 9 … 36. */
export function pageList(page: number, pages: number): Array<number | null> {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const list: Array<number | null> = [];
  for (let item = 1; item <= pages; item += 1) {
    if (!wanted.has(item)) continue;
    const previous = list.at(-1);
    if (typeof previous === "number" && item - previous > 1) list.push(null);
    list.push(item);
  }
  return list;
}
