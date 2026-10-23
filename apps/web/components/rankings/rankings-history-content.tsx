"use client";

import { RankingsHistoryWeekMatrix } from "@/components/rankings/rankings-history-week-matrix";
import type { PollHistorySeason } from "@/lib/poll-history-data";

export function RankingsHistoryContent({
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
  const numberOneCounts = new Map<string, { name: string; count: number }>();
  for (const week of activeSeason.weeks) {
    const existing = numberOneCounts.get(week.teamId);
    if (existing) {
      existing.count += 1;
    } else {
      numberOneCounts.set(week.teamId, {
        name: week.teamShortName,
        count: 1,
      });
    }
  }
  const leaders = [...numberOneCounts.values()].sort(
    (a, b) => b.count - a.count,
  );

  return (
    <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22.5rem)] lg:items-start">
      <RankingsHistoryWeekMatrix
        sport={sport}
        division={division}
        seasons={seasons}
        activeSeason={activeSeason}
      />

      <aside
        className="min-w-0 self-start rounded-xl border bg-card shadow-xs"
        aria-label="No. 1 history"
      >
        <div className="border-b px-5 py-5">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">
            No. 1 history
          </h2>
          <p className="text-sm text-muted-foreground">
            Who held the top spot ({activeSeason.year})
          </p>
        </div>
        <div className="max-h-[min(70vh,28rem)] overflow-y-auto px-5 pb-5 pt-3">
          {leaders.length > 0 ? (
            <p className="mb-3 text-xs text-muted-foreground">
              {leaders
                .slice(0, 3)
                .map(
                  (leader) =>
                    `${leader.name} ${leader.count} week${leader.count === 1 ? "" : "s"}`,
                )
                .join(" · ")}
            </p>
          ) : null}
          <ul>
            {activeSeason.weeks.map((week) => (
              <li
                key={`no1-${week.week}`}
                className="flex items-center gap-2 border-b py-2 text-sm last:border-0"
              >
                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                  {week.weekLabel}
                </span>
                <span className="min-w-0 truncate font-medium">
                  {week.teamShortName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
