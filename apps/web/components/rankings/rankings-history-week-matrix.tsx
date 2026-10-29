"use client";

import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { TeamPageLink } from "@/components/rankings/team-page-link";
import type { PollHistorySeason } from "@/lib/poll-history-data";
import { shortPollWeekLabel } from "@/lib/rankings-history-week-label";
import { NAV_LATERAL_TRANSITION } from "@/lib/view-transition-nav";

function rankCellClass(rank: number | null): string {
  if (rank == null) {
    return "text-muted-foreground";
  }
  if (rank <= 5) {
    return "bg-muted font-semibold text-foreground";
  }
  if (rank <= 15) {
    return "bg-muted/70 font-medium text-foreground";
  }
  return "bg-muted/40 text-muted-foreground";
}

export function RankingsHistoryWeekMatrix({
  sport,
  division,
  seasons,
  activeSeason,
}: {
  sport: string;
  division: string;
  seasons: { year: number }[];
  activeSeason: PollHistorySeason;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const rows = useMemo(() => {
    const filtered = activeSeason.teams.filter((team) => {
      if (!normalized) {
        return true;
      }
      return (
        team.teamName.toLowerCase().includes(normalized) ||
        team.teamShortName.toLowerCase().includes(normalized)
      );
    });
    return filtered;
  }, [activeSeason.teams, normalized]);

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-5">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            Week by week
          </h2>
          <p className="text-sm text-muted-foreground">
            Every team ranked at least once in {activeSeason.year}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Find a team"
            className="h-9 w-44 sm:w-48"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Find a team"
          />
          <Select
            value={String(activeSeason.year)}
            onValueChange={(value) => {
              router.push(
                `/college/${sport}/rankings/${division}/history?year=${value}`,
                { transitionTypes: [...NAV_LATERAL_TRANSITION] },
              );
            }}
          >
            <SelectTrigger className="h-9 w-[7rem] text-sm" aria-label="Season">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((row) => (
                <SelectItem key={row.year} value={String(row.year)}>
                  {row.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className="isolate max-h-[min(70vh,38rem)] w-full max-w-full overflow-auto overscroll-contain"
        aria-label="Week-by-week rankings table, scrollable"
      >
        <table className="w-max border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky top-0 left-0 z-50 border-r bg-card p-2 text-left text-sm uppercase tracking-wide text-muted-foreground shadow-[4px_0_6px_-4px_rgba(0,0,0,0.25)]">
                Team
              </th>
              {activeSeason.weeks.map((week, weekIndex) => (
                <th
                  key={week.week}
                  title={week.weekLabel}
                  className="sticky top-0 z-40 bg-card p-2 text-center text-sm uppercase tracking-wide text-muted-foreground"
                >
                  {shortPollWeekLabel(week, weekIndex)}
                </th>
              ))}
              <th
                title="Best rank this season (lowest number)"
                className="sticky top-0 z-40 bg-card p-2 text-center text-sm uppercase tracking-wide text-muted-foreground"
              >
                High
              </th>
              <th
                title="Worst rank this season (highest number)"
                className="sticky top-0 z-40 bg-card p-2 text-center text-sm uppercase tracking-wide text-muted-foreground"
              >
                Low
              </th>
              <th
                title="Weeks ranked in the Top 25"
                className="sticky top-0 z-40 bg-card p-2 pr-4 text-center text-sm uppercase tracking-wide text-muted-foreground"
              >
                Wks
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((team) => (
              <tr key={team.teamId} className="group border-b">
                <td className="sticky left-0 z-30 border-r bg-card px-3 py-1 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.2)] group-hover:bg-muted">
                  <div className="relative z-10 flex w-36 max-w-[9rem] items-center gap-2 bg-inherit sm:w-40 sm:max-w-none">
                    <TeamPageLink
                      slug={team.teamSlug}
                      className="truncate text-[13px] font-semibold hover:underline"
                    >
                      {team.teamShortName}
                    </TeamPageLink>
                  </div>
                </td>
                {team.ranks.map((rank, weekIndex) => (
                  <td
                    key={`${team.teamId}-${weekIndex}`}
                    className="relative z-0 p-0.5"
                  >
                    <div
                      className={`mx-auto flex h-7 w-9 items-center justify-center rounded-sm text-sm tabular sm:w-10 ${rankCellClass(rank)}`}
                      title={
                        rank != null
                          ? `${team.teamShortName} · ${activeSeason.weeks[weekIndex]?.weekLabel}: #${rank}`
                          : undefined
                      }
                    >
                      {rank ?? "–"}
                    </div>
                  </td>
                ))}
                <td className="px-2 text-center text-sm tabular">
                  {team.high ?? "–"}
                </td>
                <td className="px-2 text-center text-sm tabular text-muted-foreground">
                  {team.low ?? "–"}
                </td>
                <td className="px-2 pr-4 text-center text-sm tabular text-muted-foreground">
                  {team.weeksRanked}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t px-5 py-2.5 text-sm leading-relaxed text-muted-foreground">
        “–” = unranked that week.{" "}
        <span className="text-foreground/80">
          High / Low = best and worst rank in the season. Wks = weeks the team
          appeared in the Top 25.
        </span>{" "}
        Scroll inside the table to see more teams and weeks.
      </p>
    </div>
  );
}
