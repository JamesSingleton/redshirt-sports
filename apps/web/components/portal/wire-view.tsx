"use client";

import {
  PLAYER_CLASSES,
  POSITIONS_BY_SPORT,
  type PortalWireData,
  type PublishedWireRow,
  playerPath,
} from "@redshirt-sports/db/portal";
import { Button } from "@redshirt-sports/ui/components/button";
import { Checkbox } from "@redshirt-sports/ui/components/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@redshirt-sports/ui/components/drawer";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { cn, whenSelected } from "@redshirt-sports/ui/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Info,
  ListFilter,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ClassChip,
  GradCap,
  PathArrow,
  SchoolTile,
} from "@/components/portal/marks";
import { SchoolCombobox } from "@/components/portal/school-combobox";
import {
  activeFilterCount,
  byStatus,
  chainCaption,
  EMPTY_FILTERS,
  filtersFromSearch,
  filtersToSearch,
  filterWirePlayers,
  formatClass,
  formatSize,
  formatWireDate,
  levelOptions,
  needsFullWire,
  pageList,
  playerName,
  playerOrigin,
  schoolView,
  share,
  WIRE_SORTS,
  WIRE_STATUS_CLASSES,
  WIRE_STATUS_LABELS,
  WIRE_STATUS_TABS,
  type WireCounts,
  type WireFilters,
  type WirePlayer,
  type WireSchoolView,
  wireCounts,
  wireSchoolOptions,
} from "@/components/portal/wire-format";
import type { WireScopeProps } from "@/components/portal/wire-scope";

export const PAGE_SIZE = 25;
const ANY = "__any";

/**
 * One grid for the header and every row, so labels and cells line up. It
 * follows the list's own width: a card under 40rem (phones), a row from
 * 40rem on.
 */
const PORTAL_GRID = cn(
  "grid items-center gap-3",
  "grid-cols-[minmax(0,1fr)_auto] [grid-template-areas:'player_status'_'chain_chain']",
  "@min-[40rem]/portal:gap-x-4 @min-[40rem]/portal:gap-y-0",
  // Spare width is shared, so Pos, Status, and the school path spread across
  // the row instead of piling up at its right edge.
  "@min-[40rem]/portal:grid-cols-[minmax(0,2fr)_minmax(3rem,0.5fr)_minmax(7.5rem,1fr)_minmax(9.5rem,1fr)] @min-[40rem]/portal:[grid-template-areas:'player_pos_status_chain']",
  "@min-[56rem]/portal:grid-cols-[minmax(14rem,2fr)_minmax(4rem,0.75fr)_minmax(8.5rem,1fr)_minmax(10rem,1fr)]",
);

const trigger = (active: boolean) =>
  cn("h-9 shadow-xs", active && "border-primary/50 bg-accent/40 font-semibold");

const headLabel =
  "text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase";

// ---------- Rows ----------

/** What the marks on each row mean. */
function Legend() {
  const tile =
    "flex size-5 items-center justify-center rounded border bg-white text-[9px] font-bold text-neutral-500";
  return (
    <ul
      className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]"
      aria-label="Legend"
    >
      <li className="flex items-center gap-1.5">
        <GraduationCap className="size-3.5" aria-hidden />
        Grad transfer
      </li>
      <li className="flex items-center gap-1.5">
        <span className={cn(tile, "opacity-50")} aria-hidden />
        <PathArrow />
        <span className={tile} aria-hidden />
        Last school faded, new school full
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="border-muted-foreground/40 text-muted-foreground flex size-5 items-center justify-center rounded border border-dashed text-[10px] font-bold"
          aria-hidden
        >
          ?
        </span>
        Undecided
      </li>
    </ul>
  );
}

function PlayerRow({
  data,
  player,
}: {
  data: PortalWireData;
  player: WirePlayer;
}) {
  const row: PublishedWireRow = player.latest;
  const withdrew = row.status === "withdrawn";
  const from = schoolView(data, row.origin);
  const to = schoolView(data, row.destination);
  const caption = chainCaption(row);
  const origin = playerOrigin(row);
  const size = formatSize(row);
  const playerClass = formatClass(row.classAtEntry);
  // Schools before the one they're leaving, oldest first.
  const earlier = (row.path ?? [])
    .map((stop) => schoolView(data, stop))
    .filter((view): view is WireSchoolView => view !== null);
  const path = `School path: ${[
    ...earlier.map((view) => view.name),
    ...(withdrew
      ? [`returning to ${from?.name ?? "their school"}`]
      : [from?.name ?? "unknown", to?.name ?? "undecided"]),
  ].join(" → ")}`;

  return (
    <li
      className={cn(
        PORTAL_GRID,
        "bg-card hover:bg-muted/40 rounded-xl border px-4 py-3 shadow-xs transition-colors",
        caption && "pb-6",
      )}
    >
      <div className="flex min-w-0 items-center gap-3 [grid-area:player]">
        <img
          src="/images/player-avatar.svg"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full"
        />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={playerPath({ id: row.playerId, slug: row.slug })}
              className="font-display text-primary truncate text-lg leading-tight font-bold hover:underline"
              prefetch={false}
            >
              {playerName(row)}
            </Link>
            {row.isGradTransfer ? <GradCap /> : null}
          </div>
          {origin ? (
            <div className="text-muted-foreground truncate text-sm">
              {origin}
            </div>
          ) : null}
          {row.position || size || playerClass ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm">
              {row.position ? (
                <b className="font-semibold @min-[40rem]/portal:hidden">
                  {row.position}
                </b>
              ) : null}
              {size ? <span className="tabular">{size}</span> : null}
              {playerClass ? <ClassChip code={playerClass} /> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="font-display hidden text-base font-bold [grid-area:pos] @min-[40rem]/portal:block">
        {row.position ?? "—"}
      </div>

      <div className="grid justify-items-end gap-1 [grid-area:status] @min-[40rem]/portal:justify-items-start">
        <span
          className={cn(
            "inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold",
            WIRE_STATUS_CLASSES[row.status],
          )}
        >
          {WIRE_STATUS_LABELS[row.status]}
        </span>
        <span className="text-muted-foreground tabular text-[11px]">
          <span className="@min-[40rem]/portal:hidden">
            {formatWireDate(row.occurredAt, true)}
          </span>
          <span className="hidden @min-[40rem]/portal:inline">
            {formatWireDate(row.occurredAt)}
          </span>
        </span>
      </div>

      <div className="min-w-0 [grid-area:chain]">
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-2"
          role="img"
          aria-label={path}
        >
          {earlier.map((view, index) => (
            // A player can be at one school twice, so the index keeps keys unique.
            <Fragment key={`${view.key}-${index}`}>
              <SchoolTile view={view} faded />
              <PathArrow />
            </Fragment>
          ))}
          {withdrew ? (
            <SchoolTile view={from} caption={caption} />
          ) : (
            <>
              <SchoolTile view={from} faded />
              <PathArrow />
              <SchoolTile view={to} caption={caption} />
            </>
          )}
        </div>
      </div>
    </li>
  );
}

// ---------- Filters ----------

function FilterSelect({
  label,
  value,
  onChange,
  options,
  onOpen,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; nested?: boolean }>;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <Select
      value={value || ANY}
      onValueChange={whenSelected((next: string) =>
        onChange(next === ANY ? "" : next),
      )}
      onOpenChange={(open) => open && onOpen()}
    >
      <SelectTrigger
        aria-label={label}
        className={cn(trigger(Boolean(value)), className)}
      >
        {/* Rendered on the server too, so the trigger isn't blank before hydration. */}
        <SelectValue>
          {options.find((option) => option.value === value)?.label ??
            `All ${label.toLowerCase()}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>All {label.toLowerCase()}</SelectItem>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={option.nested ? "pl-6" : undefined}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** One number on the scoreboard. */
function Tally({
  label,
  value,
  note,
  dot,
}: {
  label: string;
  value: number;
  note?: string;
  /** Matches this figure's slice of the bar, and its status pill. */
  dot?: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-1 pr-4 sm:px-6 sm:first:pl-0">
      <dt className={cn(headLabel, "flex items-center gap-1.5")}>
        {dot ? (
          <span className={cn("size-2 rounded-full", dot)} aria-hidden />
        ) : null}
        {label}
      </dt>
      <dd className="flex items-baseline gap-2">
        <span className="font-display tabular text-4xl leading-none font-extrabold md:text-5xl">
          {value.toLocaleString("en-US")}
        </span>
        {note ? (
          <span className="text-muted-foreground tabular text-sm">{note}</span>
        ) : null}
      </dd>
    </div>
  );
}

/** Where every player who entered stands: the numbers, then one bar. */
function Scoreboard({
  counts,
  scopeLabel,
}: {
  counts: WireCounts;
  scopeLabel: string;
}) {
  return (
    <section
      aria-label={`${scopeLabel} so far`}
      className="flex flex-col gap-4"
    >
      <dl className="grid grid-cols-2 gap-y-4 sm:flex sm:divide-x">
        <Tally label="Entered" value={counts.all} />
        <Tally
          label="Committed"
          value={counts.committed}
          note={share(counts.committed, counts.all)}
          dot="bg-new"
        />
        <Tally
          label="Still in portal"
          value={counts.entered}
          note={share(counts.entered, counts.all)}
          dot="bg-up"
        />
        <Tally
          label="Withdrawn"
          value={counts.withdrawn}
          note={share(counts.withdrawn, counts.all)}
          dot="bg-muted-foreground/60"
        />
      </dl>
    </section>
  );
}

/**
 * The tracker: a filter card, the cycle's numbers, and every player as a
 * row. The server sends the newest players; the whole cycle loads once, as
 * cached JSON, when someone filters, sorts, or pages. Filters live in the URL
 * so a view can be shared, but the server never reads them, so the page stays
 * cacheable.
 */
export function WireView({
  initial,
  initialCounts,
  totalPlayers,
  jsonUrl,
  scope,
}: {
  initial: PortalWireData;
  /** The whole cycle's counts, for the first paint before anything loads. */
  initialCounts: WireCounts;
  totalPlayers: number;
  jsonUrl: string;
  scope: WireScopeProps;
}) {
  const gradId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const complete =
    initialCounts.all <=
    wireCounts(filterWirePlayers(initial, EMPTY_FILTERS)).all;
  const [full, setFull] = useState<PortalWireData | null>(
    complete ? initial : null,
  );
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [filters, setFilters] = useState<WireFilters>(EMPTY_FILTERS);

  const loadAll = useCallback(() => {
    if (full || loadState === "loading") return;
    setLoadState("loading");
    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PortalWireData>;
      })
      .then((data) => {
        setFull(data);
        setLoadState("idle");
      })
      .catch(() => setLoadState("error"));
  }, [full, jsonUrl, loadState]);

  // Filters from a shared link. Until it's been read, the URL isn't written,
  // or the first render's empty filters would wipe it.
  const [urlRead, setUrlRead] = useState(false);
  useEffect(() => {
    const fromUrl = filtersFromSearch(window.location.search);
    if (needsFullWire(fromUrl)) setFilters(fromUrl);
    setUrlRead(true);
  }, []);

  useEffect(() => {
    if (!urlRead) return;
    if (needsFullWire(filters)) loadAll();
    const search = filtersToSearch(filters);
    if (search !== window.location.search) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${search}`,
      );
    }
  }, [filters, loadAll, urlRead]);

  const data = full ?? initial;
  const base = useMemo(() => filterWirePlayers(data, filters), [data, filters]);
  // Before the whole cycle loads, the first paint shows the server's counts.
  const counts = full ? wireCounts(base) : initialCounts;
  const players = byStatus(base, filters.status);
  const total = full ? players.length : totalPlayers;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const visible = players.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const levels = useMemo(() => levelOptions(data.levels), [data.levels]);
  const schools = useMemo(
    () => wireSchoolOptions(data, filters.level),
    [data, filters.level],
  );
  const levelName = levels.find((level) => level.slug === filters.level)?.name;
  const schoolName = schools.find(
    (school) => school.key === filters.school,
  )?.name;
  const narrowing = activeFilterCount(filters);
  const sportLabel =
    scope.sports.find((item) => item.slug === scope.sport)?.label ??
    scope.sport;

  const set = (patch: Partial<WireFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const goToPage = (next: number) => {
    setFilters((current) => ({ ...current, page: next }));
    listRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const positions = (POSITIONS_BY_SPORT[scope.sport] ?? []).map((position) => ({
    value: position.code,
    label: position.code,
  }));
  const classes = PLAYER_CLASSES.map((item) => ({
    value: item.code,
    label: item.code,
  }));
  const statusOptions = WIRE_STATUS_TABS.filter((tab) => tab.value).map(
    (tab) => ({
      value: tab.value,
      label: `${tab.label} · ${counts[tab.value as keyof WireCounts].toLocaleString("en-US")}`,
    }),
  );
  const divisionOptions = levels.map((level) => ({
    value: level.slug,
    label: level.name,
    nested: level.nested,
  }));

  /** Every filter control, laid out by the caller: a row on desktop, a sheet on phones. */
  const controls = (className?: string): ReactNode[] => [
    <FilterSelect
      key="status"
      label="Statuses"
      value={filters.status}
      onChange={(status) => set({ status: status as WireFilters["status"] })}
      options={statusOptions}
      onOpen={loadAll}
      className={className}
    />,
    <FilterSelect
      key="division"
      label="Divisions"
      value={filters.level}
      // A school picked under another division may not be in this one.
      onChange={(level) => set({ level, school: "" })}
      options={divisionOptions}
      onOpen={loadAll}
      className={className}
    />,
    <SchoolCombobox
      key="school"
      className={cn(trigger(Boolean(filters.school)), "max-w-56", className)}
      options={schools}
      value={filters.school}
      onChange={(school) => set({ school })}
      onOpen={loadAll}
    />,
    <FilterSelect
      key="position"
      label="Positions"
      value={filters.position}
      onChange={(position) => set({ position })}
      options={positions}
      onOpen={loadAll}
      className={className}
    />,
    <FilterSelect
      key="class"
      label="Classes"
      value={filters.playerClass}
      onChange={(playerClass) => set({ playerClass })}
      options={classes}
      onOpen={loadAll}
      className={className}
    />,
  ];

  type Chip = { key: string; label: string; clear: Partial<WireFilters> };
  const chips: Chip[] = [];
  if (filters.status) {
    chips.push({
      key: "status",
      label:
        // `filtersFromSearch` only lets known statuses through.
        WIRE_STATUS_TABS.find((tab) => tab.value === filters.status)!.label,
      clear: { status: "" },
    });
  }
  if (filters.q)
    chips.push({ key: "q", label: `“${filters.q}”`, clear: { q: "" } });
  if (filters.level) {
    chips.push({
      key: "level",
      label: levelName ?? filters.level,
      clear: { level: "", school: "" },
    });
  }
  if (filters.school) {
    chips.push({
      key: "school",
      label: schoolName ?? "School",
      clear: { school: "" },
    });
  }
  if (filters.position) {
    chips.push({
      key: "position",
      label: filters.position,
      clear: { position: "" },
    });
  }
  if (filters.playerClass) {
    chips.push({
      key: "class",
      label: filters.playerClass,
      clear: { playerClass: "" },
    });
  }
  if (filters.gradTransfer) {
    chips.push({
      key: "grad",
      label: "Grad transfers",
      clear: { gradTransfer: false },
    });
  }

  const sortSelect = (className?: string) => (
    <Select
      value={filters.sort}
      onValueChange={(sort) => set({ sort: sort as WireFilters["sort"] })}
      onOpenChange={(open) => open && loadAll()}
    >
      <SelectTrigger
        aria-label="Sort"
        className={cn("h-9 shadow-xs", className)}
      >
        <SelectValue>
          {WIRE_SORTS.find((item) => item.value === filters.sort)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {WIRE_SORTS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  /** Rendered twice (desktop row, phone sheet), so each copy gets its own id. */
  const gradToggle = (where: string) => (
    <label
      htmlFor={`${gradId}-${where}`}
      className={cn(
        trigger(filters.gradTransfer),
        "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 text-sm",
      )}
    >
      <Checkbox
        id={`${gradId}-${where}`}
        checked={filters.gradTransfer}
        onCheckedChange={(checked) => {
          loadAll();
          set({ gradTransfer: checked === true });
        }}
      />
      Grad transfers
    </label>
  );

  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <Scoreboard
        counts={counts}
        scopeLabel={`${levelName ?? sportLabel} ${scope.year}`}
      />
      <div className="bg-card mt-2 grid grid-cols-[minmax(0,1fr)] gap-3 rounded-xl border p-3 shadow-xs">
        {/* One row of filters from tablets up: a modest search, every
            filter, then sort at the end. Phones get search, then a Filters
            sheet beside sort. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-56 lg:w-60">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Search player or school"
              placeholder="Search player or school"
              className="h-9 pl-8"
              value={filters.q}
              onFocus={loadAll}
              onChange={(event) => set({ q: event.target.value })}
            />
          </div>
          <div className="hidden md:contents">
            {controls()}
            {gradToggle("row")}
            <span className="ml-auto flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sort</span>
              {sortSelect()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          <Drawer>
            <DrawerTrigger
              render={
                <Button
                  variant="outline"
                  className="h-9 w-full"
                  onClick={loadAll}
                />
              }
            >
              <ListFilter className="size-4" aria-hidden />
              Filters{narrowing ? ` · ${narrowing}` : ""}
            </DrawerTrigger>
            <DrawerContent
              showCloseButton
              className="max-h-[85dvh] overflow-y-auto"
            >
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
                <DrawerDescription>
                  {total.toLocaleString("en-US")}{" "}
                  {total === 1 ? "player" : "players"} match
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-2 px-4 pb-6">
                {controls("w-full max-w-none")}
                {gradToggle("sheet")}
              </div>
            </DrawerContent>
          </Drawer>
          {sortSelect("w-full min-w-0")}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground" aria-live="polite">
            {loadState === "loading"
              ? "Loading every player…"
              : loadState === "error"
                ? "Couldn't load every player. Showing the newest."
                : total === 0
                  ? "No players"
                  : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + visible.length} of ${total.toLocaleString("en-US")}`}
          </span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-label={`Remove filter: ${chip.label}`}
              onClick={() => set(chip.clear)}
              className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            >
              {chip.label}
              <X className="size-3" aria-hidden />
            </button>
          ))}
          {narrowing ? (
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => set({ ...EMPTY_FILTERS, sort: filters.sort })}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <Legend />

      <div ref={listRef} className="@container/portal grid scroll-mt-24 gap-2">
        <div
          className={cn(
            PORTAL_GRID,
            "bg-muted/60 hidden rounded-lg border border-transparent px-4 py-2 @min-[40rem]/portal:grid",
          )}
          aria-hidden
        >
          <div className={cn(headLabel, "[grid-area:player]")}>Player</div>
          <div className={cn(headLabel, "[grid-area:pos]")}>Pos</div>
          <div className={cn(headLabel, "[grid-area:status]")}>Status</div>
          <div className={cn(headLabel, "[grid-area:chain]")}>
            Last <span className="tracking-normal">→</span> New
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
            {totalPlayers === 0
              ? "No one has entered the portal yet this cycle."
              : "No players match these filters."}
          </p>
        ) : (
          <ol className="grid gap-2">
            {visible.map((player) => (
              <PlayerRow
                key={player.recruitmentId}
                data={data}
                player={player}
              />
            ))}
          </ol>
        )}
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Info className="size-3.5 shrink-0" aria-hidden />
        Maintained from Redshirt Sports reporting, not every portal entry.
      </p>

      {pages > 1 ? (
        <nav
          className="flex items-center justify-center gap-1"
          aria-label="Pages"
        >
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
          {pageList(page, pages).map((item, index) =>
            item === null ? (
              <span
                key={`gap-${index}`}
                className="text-muted-foreground px-2"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "outline" : "ghost"}
                size="icon"
                aria-current={item === page ? "page" : undefined}
                onClick={() => goToPage(item)}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            variant="ghost"
            disabled={page === pages}
            onClick={() => goToPage(page + 1)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
