"use client";

import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { Switch } from "@redshirt-sports/ui/components/switch";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TeamMark } from "@/components/rankings/team-mark";
import { OUTLIER_RANK_GAP, rankHeatCellClass } from "@/lib/ballot-outliers";
import {
  ballotMatrixColumnModeQueryValue,
  ballotMatrixShowPtsFirstColumns,
  ballotMatrixShowVoterColumns,
  parseBallotMatrixColumnMode,
  voterHasOutlierByIndex,
} from "@/lib/ballots-matrix-filters";
import type { BallotsPageMatrix } from "@/lib/ballots-page-data";
import { TOP_25 } from "@/lib/constants";

function isHighlightModeActive(
  highlightVoter: string,
  highlightSet: Set<string>,
) {
  return highlightVoter !== "__all__" || highlightSet.size > 0;
}

function isVoterColumnHighlighted(
  voter: BallotsPageMatrix["voters"][number] | undefined,
  highlightVoter: string,
  highlightSet: Set<string>,
) {
  if (!voter) {
    return false;
  }
  return (
    (highlightVoter !== "__all__" && highlightVoter === voter.slug) ||
    highlightSet.has(voter.userId)
  );
}

function matrixHoverBackground(
  rowHovered: boolean,
  colHovered: boolean,
  sticky = false,
) {
  if (!rowHovered && !colHovered) {
    return sticky ? "bg-card" : undefined;
  }
  // Opaque fills only — translucent sticky cells show scrolling rows underneath.
  if (rowHovered && colHovered) {
    return "bg-accent";
  }
  return "bg-muted";
}

/**
 * One background per cell. Hover paints the row and column crosshair.
 * A selected voter keeps that wash so it does not swap to the hover fill
 * and slide over the sticky team column.
 */
function voterCellSurface(
  emphasized: boolean,
  rowHovered: boolean,
  colHovered: boolean,
) {
  if (emphasized) {
    if (rowHovered && colHovered) {
      return "bg-primary/20";
    }
    if (rowHovered || colHovered) {
      return "bg-primary/15";
    }
    return "bg-primary/10";
  }
  return matrixHoverBackground(rowHovered, colHovered);
}

/**
 * The heat fill covers the cell background. A translucent inset wash lets the
 * row and column show through without replacing the rank color.
 */
function rankHoverWash(rowHovered: boolean, colHovered: boolean) {
  if (rowHovered && colHovered) {
    return "shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--accent)_62%,transparent)]";
  }
  if (rowHovered || colHovered) {
    return "shadow-[inset_0_0_0_999px_color-mix(in_oklch,var(--muted)_48%,transparent)]";
  }
  return undefined;
}

function stickyRowZ(rowHovered: boolean) {
  // Below the header (z-30) so a hovered row cannot cover the sticky names.
  return rowHovered ? "z-20" : "z-10";
}

/** Covers the sticky-column seam on small screens without a visible rule or extra scroll width. */
const stickyColumnEdge =
  "border-r-0 shadow-[1px_0_0_0_var(--card)] sm:border-r sm:shadow-none";

function leaveVoterColumn(
  event: MouseEvent,
  voterIndex: number,
  clear: () => void,
) {
  const related = event.relatedTarget;
  if (
    related instanceof Element &&
    related.closest(`[data-voter-col="${voterIndex}"]`)
  ) {
    return;
  }
  clear();
}

export function BallotsMatrixPanel({
  matrix,
  highlightVoterIds,
}: {
  matrix: BallotsPageMatrix;
  highlightVoterIds: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const patchQuery = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const teamQuery = searchParams.get("q") ?? "";
  const columnMode = parseBallotMatrixColumnMode(searchParams.get("columns"));
  const outliersFromUrl = searchParams.get("outliers") === "1";
  const receivingVotesFromUrl = searchParams.get("rv") !== "0";
  // The URL is the source of truth, but the switch flips before the navigation
  // finishes. On a phone that gap reads as a dead toggle.
  const [votersWithOutliersOnly, setVotersWithOutliersOnly] =
    useState(outliersFromUrl);
  const [showReceivingVotes, setShowReceivingVotes] = useState(
    receivingVotesFromUrl,
  );

  useEffect(() => {
    setVotersWithOutliersOnly(outliersFromUrl);
  }, [outliersFromUrl]);

  useEffect(() => {
    setShowReceivingVotes(receivingVotesFromUrl);
  }, [receivingVotesFromUrl]);

  const highlightVoter = useMemo(() => {
    const fromUrl = searchParams.get("voter")?.trim();
    if (fromUrl) {
      return fromUrl;
    }
    if (highlightVoterIds.length === 1) {
      const voter = matrix.voters.find((v) =>
        highlightVoterIds.includes(v.userId),
      );
      return voter?.slug ?? "__all__";
    }
    return "__all__";
  }, [highlightVoterIds, matrix.voters, searchParams]);

  const [hoverRowId, setHoverRowId] = useState<string | null>(null);
  const [hoverVoterIndex, setHoverVoterIndex] = useState<number | null>(null);

  const highlightSet = useMemo(
    () => new Set(highlightVoterIds),
    [highlightVoterIds],
  );

  const voterOutlierFlags = useMemo(
    () => voterHasOutlierByIndex(matrix),
    [matrix],
  );

  const showVoterColumns = ballotMatrixShowVoterColumns(columnMode);
  const showPtsFirstColumns = ballotMatrixShowPtsFirstColumns(columnMode);

  const visibleVoterIndexes = useMemo(() => {
    if (!showVoterColumns) {
      return [];
    }
    let indexes = matrix.voters.map((_, index) => index);
    if (votersWithOutliersOnly) {
      indexes = indexes.filter((index) => voterOutlierFlags[index]);
    }
    return indexes;
  }, [
    showVoterColumns,
    matrix.voters,
    votersWithOutliersOnly,
    voterOutlierFlags,
  ]);

  const filteredRows = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    return matrix.rows.filter((row) => {
      if (!showReceivingVotes && row.isReceivingVotesOnly) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        row.name.toLowerCase().includes(q) ||
        row.shortName.toLowerCase().includes(q) ||
        row.abbreviation.toLowerCase().includes(q)
      );
    });
  }, [matrix.rows, showReceivingVotes, teamQuery]);

  const top25Rows = filteredRows.filter((row) => !row.isReceivingVotesOnly);
  const rvRows = filteredRows.filter((row) => row.isReceivingVotesOnly);
  const highlightMode = isHighlightModeActive(highlightVoter, highlightSet);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="rounded-xl border bg-card p-3 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="ballots-team-search" className="text-sm">
              Team search
            </Label>
            <Input
              id="ballots-team-search"
              value={teamQuery}
              onChange={(e) => patchQuery({ q: e.target.value.trim() || null })}
              placeholder="Filter teams…"
              className="mt-1 h-9"
            />
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:contents">
            <div className="min-w-0">
              <Label htmlFor="ballots-highlight-voter" className="text-sm">
                Highlight voter
              </Label>
              <Select
                value={highlightVoter}
                onValueChange={(slug) =>
                  patchQuery({
                    voter: slug === "__all__" ? null : slug,
                    voters: null,
                  })
                }
              >
                <SelectTrigger
                  id="ballots-highlight-voter"
                  className="mt-1 h-9 w-full min-w-0"
                >
                  <SelectValue placeholder="All voters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All voters</SelectItem>
                  {matrix.voters.map((voter) => (
                    <SelectItem key={voter.userId} value={voter.slug}>
                      {voter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <Label htmlFor="ballots-columns" className="text-sm">
                Columns
              </Label>
              <Select
                value={columnMode}
                onValueChange={(v) =>
                  patchQuery({
                    columns: ballotMatrixColumnModeQueryValue(
                      parseBallotMatrixColumnMode(v),
                    ),
                  })
                }
              >
                <SelectTrigger
                  id="ballots-columns"
                  className="mt-1 h-9 w-full min-w-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All voters</SelectItem>
                  <SelectItem value="summary">Summary only</SelectItem>
                  <SelectItem value="on-range">On &amp; range</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 hidden text-sm leading-snug text-muted-foreground sm:block">
                {columnMode === "all"
                  ? "Full matrix with every voter column."
                  : columnMode === "summary"
                    ? "Pts, 1st, On, and Range — no voter columns."
                    : "Only On and Range — no voters, points, or first-place votes."}
              </p>
            </div>
          </div>
          <div className="grid gap-1 sm:col-span-2 sm:grid-cols-2 sm:gap-x-6 lg:col-span-1 lg:grid-cols-1 lg:content-end">
            <Label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span className="text-sm">Voters with outliers only</span>
              <Switch
                className="touch-manipulation"
                checked={votersWithOutliersOnly}
                onCheckedChange={(checked) => {
                  setVotersWithOutliersOnly(checked);
                  patchQuery({ outliers: checked ? "1" : null });
                }}
              />
            </Label>
            <Label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span className="text-sm">Show RV rows</span>
              <Switch
                className="touch-manipulation"
                checked={showReceivingVotes}
                onCheckedChange={(checked) => {
                  setShowReceivingVotes(checked);
                  patchQuery({ rv: checked ? null : "0" });
                }}
              />
            </Label>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground sm:hidden">
        <b className="text-foreground">{matrix.ballotsCounted}</b> ballots ·{" "}
        <b className="text-foreground">{matrix.unanimousTeamCount}</b> on every
        ballot · <b className="text-foreground">{matrix.outlierPickCount}</b>{" "}
        outlier picks · <b className="text-foreground">{matrix.leftOffCount}</b>{" "}
        left off
      </p>
      <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-5">
        <StatCard
          label="Ballots counted"
          value={`${matrix.ballotsCounted} of ${matrix.panelSize}`}
          detail="panel voters who submitted"
        />
        <StatCard
          label="On every ballot"
          value={String(matrix.unanimousTeamCount)}
          detail="teams ranked by all voters"
        />
        <StatCard
          label="First-place votes"
          value={`${matrix.topFirstPlaceVotes} / ${matrix.ballotsCounted}`}
          detail="No. 1 team"
        />
        <StatCard
          label="Outlier picks"
          value={String(matrix.outlierPickCount)}
          detail={`${OUTLIER_RANK_GAP}+ spots from the published rank`}
        />
        <StatCard
          label="Left off"
          value={String(matrix.leftOffCount)}
          detail={`Published Top ${TOP_25} teams missing from a ballot`}
        />
      </div>

      {votersWithOutliersOnly &&
      columnMode === "all" &&
      visibleVoterIndexes.length === 0 ? (
        <p className="rounded-xl border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          No voters have outlier picks this week.
        </p>
      ) : null}
      {votersWithOutliersOnly && visibleVoterIndexes.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          A dash is a published Top {TOP_25} team that voter left off. A gold
          outline is a rank {OUTLIER_RANK_GAP} or more spots from the published
          order.
        </p>
      ) : null}

      <div className="min-w-0 overflow-clip rounded-xl border bg-card">
        <div
          className="relative w-full min-w-0 max-w-full overflow-x-auto overflow-y-clip overscroll-x-contain pe-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          // Keyboard users need a tab stop so they can scroll this overflow region.
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region has no focusable cells
          tabIndex={0}
          aria-label="Ballot matrix"
        >
          <table
            className="w-full min-w-max caption-bottom text-sm sm:text-base"
            onMouseLeave={() => {
              setHoverRowId(null);
              setHoverVoterIndex(null);
            }}
          >
            <caption className="sr-only">
              Ballot matrix: team ranks by voter
            </caption>
            <thead>
              <tr className="border-b">
                <th
                  scope="col"
                  className="sticky left-0 z-30 w-8 min-w-8 bg-card p-2 pl-2 text-right font-display text-sm font-bold sm:w-10 sm:min-w-10 sm:text-sm"
                >
                  Rk
                </th>
                <th
                  scope="col"
                  className={cn(
                    "sticky left-8 z-30 w-[7.25rem] max-w-[7.25rem] bg-card px-2 text-left text-sm font-semibold sm:left-10 sm:w-auto sm:max-w-none sm:min-w-[10rem] sm:text-sm",
                    stickyColumnEdge,
                  )}
                >
                  Team
                </th>
                {showPtsFirstColumns ? (
                  <>
                    <th
                      scope="col"
                      className="hidden px-2 text-right text-sm font-semibold sm:table-cell"
                    >
                      Pts
                    </th>
                    <th
                      scope="col"
                      className="hidden px-2 text-right text-sm font-semibold sm:table-cell"
                    >
                      1st
                    </th>
                  </>
                ) : null}
                {visibleVoterIndexes.length > 0
                  ? visibleVoterIndexes.map((voterIndex) => {
                      const voter = matrix.voters[voterIndex];
                      if (!voter) return null;
                      const emphasized = isVoterColumnHighlighted(
                        voter,
                        highlightVoter,
                        highlightSet,
                      );
                      const colHovered = hoverVoterIndex === voterIndex;
                      const dimmed = highlightMode && !emphasized;
                      return (
                        <th
                          key={voter.userId}
                          scope="col"
                          data-voter-col={voterIndex}
                          onMouseEnter={() => setHoverVoterIndex(voterIndex)}
                          onMouseLeave={(event) =>
                            leaveVoterColumn(event, voterIndex, () =>
                              setHoverVoterIndex(null),
                            )
                          }
                          className={cn(
                            "p-0 text-center align-bottom transition-colors",
                            emphasized
                              ? "bg-primary/15"
                              : colHovered && "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block max-h-28 min-w-9 overflow-hidden px-0.5 pb-2 text-sm font-semibold [writing-mode:vertical-rl] rotate-180 sm:min-w-11 sm:text-sm",
                              emphasized && "text-primary",
                              dimmed && "opacity-35",
                            )}
                            title={voter.label}
                          >
                            {voter.shortLabel}
                          </span>
                        </th>
                      );
                    })
                  : null}
                <th
                  scope="col"
                  className={cn(
                    "px-2 text-center text-sm font-semibold",
                    !showVoterColumns && "border-l",
                  )}
                >
                  On
                </th>
                <th
                  scope="col"
                  className="px-2 text-center text-sm font-semibold"
                >
                  Range
                </th>
              </tr>
            </thead>
            <tbody>
              {top25Rows.map((row) => (
                <MatrixRow
                  key={row.teamId}
                  row={row}
                  voters={matrix.voters}
                  showPtsFirstColumns={showPtsFirstColumns}
                  visibleVoterIndexes={visibleVoterIndexes}
                  highlightVoter={highlightVoter}
                  highlightSet={highlightSet}
                  highlightMode={highlightMode}
                  hoverRowId={hoverRowId}
                  hoverVoterIndex={hoverVoterIndex}
                  onHoverRowId={setHoverRowId}
                  onHoverVoterIndex={setHoverVoterIndex}
                />
              ))}
              {rvRows.length > 0 ? (
                <tr className="border-b">
                  <th
                    scope="row"
                    className="sticky left-0 z-[15] w-8 min-w-8 bg-muted/40 sm:w-10 sm:min-w-10"
                    aria-hidden
                  />
                  <td
                    className={cn(
                      "sticky left-8 z-[15] w-[7.25rem] max-w-[7.25rem] bg-muted/40 px-2 py-2.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground sm:left-10 sm:w-auto sm:max-w-none sm:min-w-[10rem] sm:text-sm",
                      stickyColumnEdge,
                    )}
                  >
                    <span
                      className="block truncate"
                      title="Others receiving votes"
                    >
                      Others receiving votes
                    </span>
                  </td>
                  {showPtsFirstColumns ? (
                    <>
                      <td className="hidden bg-muted/40 sm:table-cell" />
                      <td className="hidden bg-muted/40 sm:table-cell" />
                    </>
                  ) : null}
                  {visibleVoterIndexes.map((voterIndex) => {
                    const voter = matrix.voters[voterIndex];
                    const emphasized = isVoterColumnHighlighted(
                      voter,
                      highlightVoter,
                      highlightSet,
                    );
                    const colHovered = hoverVoterIndex === voterIndex;
                    return (
                      <td
                        key={`rv-gap-${voterIndex}`}
                        data-voter-col={voterIndex}
                        onMouseEnter={() => setHoverVoterIndex(voterIndex)}
                        onMouseLeave={(event) =>
                          leaveVoterColumn(event, voterIndex, () =>
                            setHoverVoterIndex(null),
                          )
                        }
                        className={cn(
                          "transition-colors",
                          emphasized
                            ? colHovered
                              ? "bg-primary/15"
                              : "bg-primary/10"
                            : colHovered
                              ? "bg-muted"
                              : "bg-muted/40",
                        )}
                      />
                    );
                  })}
                  <td className="bg-muted/40" />
                  <td className="bg-muted/40" aria-hidden />
                </tr>
              ) : null}
              {rvRows.map((row) => (
                <MatrixRow
                  key={row.teamId}
                  row={row}
                  voters={matrix.voters}
                  showPtsFirstColumns={showPtsFirstColumns}
                  visibleVoterIndexes={visibleVoterIndexes}
                  highlightVoter={highlightVoter}
                  highlightSet={highlightSet}
                  highlightMode={highlightMode}
                  hoverRowId={hoverRowId}
                  hoverVoterIndex={hoverVoterIndex}
                  onHoverRowId={setHoverRowId}
                  onHoverVoterIndex={setHoverVoterIndex}
                  receivingVotes
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t px-1 py-2.5 text-sm text-muted-foreground">
        <span>Cell = rank that voter gave the team</span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-heat-1" />
          1–5
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-heat-2" />
          6–10
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-heat-3" />
          11–15
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-heat-4" />
          16–20
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-heat-5" />
          21–25
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm ring-2 ring-inset ring-gold" />
          {OUTLIER_RANK_GAP}+ spots off the published rank
        </span>
        <span className="flex items-center gap-1">
          <span className="font-semibold text-gold" aria-hidden>
            —
          </span>
          Left off a Top {TOP_25} team
        </span>
        <span>RV = others receiving votes</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="text-sm uppercase tracking-wide text-muted-foreground sm:text-sm">
        {label}
      </div>
      <div className="font-display text-2xl font-extrabold tabular sm:text-3xl">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}

function MatrixRow({
  row,
  voters,
  showPtsFirstColumns,
  visibleVoterIndexes,
  highlightVoter,
  highlightSet,
  highlightMode,
  hoverRowId,
  hoverVoterIndex,
  onHoverRowId,
  onHoverVoterIndex,
  receivingVotes,
}: {
  row: BallotsPageMatrix["rows"][number];
  voters: BallotsPageMatrix["voters"];
  showPtsFirstColumns: boolean;
  visibleVoterIndexes: number[];
  highlightVoter: string;
  highlightSet: Set<string>;
  highlightMode: boolean;
  hoverRowId: string | null;
  hoverVoterIndex: number | null;
  onHoverRowId: (teamId: string | null) => void;
  onHoverVoterIndex: (voterIndex: number | null) => void;
  receivingVotes?: boolean;
}) {
  const rowHovered = hoverRowId === row.teamId;

  return (
    <tr
      className="border-b"
      onMouseEnter={() => onHoverRowId(row.teamId)}
      onMouseLeave={() => onHoverRowId(null)}
    >
      <th
        scope="row"
        className={cn(
          "sticky left-0 w-8 min-w-8 p-0 pl-2 text-right font-display text-base font-bold tabular transition-colors sm:w-10 sm:min-w-10 sm:text-lg",
          stickyRowZ(rowHovered),
          matrixHoverBackground(rowHovered, false, true),
        )}
      >
        {receivingVotes ? "RV" : row.publishedRank}
      </th>
      <td
        className={cn(
          "sticky left-8 w-[7.25rem] max-w-[7.25rem] px-2 py-1 transition-colors sm:left-10 sm:w-auto sm:max-w-none sm:min-w-[10rem]",
          stickyColumnEdge,
          stickyRowZ(rowHovered),
          matrixHoverBackground(rowHovered, false, true),
        )}
      >
        <div className="flex w-[6.25rem] max-w-[6.25rem] items-center gap-1.5 overflow-hidden sm:w-auto sm:max-w-none sm:gap-2.5">
          <TeamMark
            image={row.image}
            shortName={row.shortName}
            abbreviation={row.abbreviation}
            name={row.name}
            size="sm"
          />
          <span
            className="truncate text-sm font-semibold"
            title={row.shortName}
          >
            {row.shortName}
          </span>
        </div>
      </td>
      {showPtsFirstColumns ? (
        <>
          <td
            className={cn(
              "hidden px-2 text-right text-sm font-semibold tabular transition-colors sm:table-cell sm:text-base",
              matrixHoverBackground(rowHovered, false),
            )}
          >
            {row.points}
          </td>
          <td
            className={cn(
              "hidden px-2 text-right text-sm text-muted-foreground tabular transition-colors sm:table-cell",
              matrixHoverBackground(rowHovered, false),
            )}
          >
            {row.firstPlaceVotes}
          </td>
        </>
      ) : null}
      {visibleVoterIndexes.length > 0
        ? visibleVoterIndexes.map((voterIndex) => {
            const cell = row.cells[voterIndex];
            const voter = voters[voterIndex];
            const rank = cell?.rank ?? null;
            const emphasized = isVoterColumnHighlighted(
              voter,
              highlightVoter,
              highlightSet,
            );
            const colHovered = hoverVoterIndex === voterIndex;
            const dimmed = highlightMode && !emphasized;
            return (
              <td
                key={voter?.userId ?? voterIndex}
                data-voter-col={voterIndex}
                onMouseEnter={() => onHoverVoterIndex(voterIndex)}
                onMouseLeave={(event) =>
                  leaveVoterColumn(event, voterIndex, () =>
                    onHoverVoterIndex(null),
                  )
                }
                className={cn(
                  "p-0 transition-colors",
                  voterCellSurface(emphasized, rowHovered, colHovered),
                )}
              >
                {rank != null ? (
                  <div
                    className={cn(
                      "mx-auto flex h-8 min-w-9 w-9 items-center justify-center text-sm font-semibold tabular sm:h-10 sm:min-w-11 sm:w-11",
                      rankHeatCellClass(rank),
                      rankHoverWash(rowHovered, colHovered),
                      dimmed && "opacity-35",
                      cell?.isOutlier && "ring-2 ring-inset ring-gold",
                    )}
                    title={cell?.isOutlier ? "Outlier pick" : undefined}
                  >
                    {rank}
                    {cell?.isOutlier ? (
                      <span className="sr-only">Outlier</span>
                    ) : null}
                  </div>
                ) : cell?.isLeftOff ? (
                  <div
                    className={cn(
                      "mx-auto flex h-8 min-w-9 w-9 items-center justify-center text-base font-semibold text-gold sm:h-10 sm:min-w-11 sm:w-11",
                      dimmed && "opacity-35",
                    )}
                    title="Left off the published Top 25"
                  >
                    <span aria-hidden>—</span>
                    <span className="sr-only">
                      Left off the published Top 25
                    </span>
                  </div>
                ) : (
                  <div
                    className="mx-auto h-8 min-w-9 w-9 sm:h-10 sm:w-11"
                    aria-hidden
                  />
                )}
              </td>
            );
          })
        : null}
      <td
        className={cn(
          "px-2 text-center text-sm tabular transition-colors sm:text-base",
          visibleVoterIndexes.length === 0 && "border-l",
          matrixHoverBackground(rowHovered, false),
        )}
      >
        {row.ballotsOn}
      </td>
      <td
        className={cn(
          "px-2 text-center text-sm tabular text-muted-foreground transition-colors sm:text-base",
          matrixHoverBackground(rowHovered, false),
        )}
      >
        {row.rankMin != null && row.rankMax != null
          ? `${row.rankMin}–${row.rankMax}`
          : "—"}
      </td>
    </tr>
  );
}
