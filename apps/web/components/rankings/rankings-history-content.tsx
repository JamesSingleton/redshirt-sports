"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
    <div className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div>
            <div className="font-display text-xl font-bold uppercase tracking-wide">
              Rank by week
            </div>
            <p className="text-sm text-muted-foreground">
              {activeSeason.year} season · {activeSeason.weeks.length} weeks
            </p>
          </div>
          <Select
            value={String(activeSeason.year)}
            onValueChange={(value) => {
              router.push(
                `/college/${sport}/rankings/${division}/history?year=${value}`,
              );
            }}
          >
            <SelectTrigger className="h-8 w-[7rem] text-xs">
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
        <div className="px-5 pb-5 pt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Week</th>
                <th className="py-2 pr-2 font-medium">No. 1</th>
                <th className="py-2 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {activeSeason.weeks.map((week) => (
                <tr key={week.week} className="border-b last:border-0">
                  <td className="py-2 pr-2">
                    <Link
                      href={week.pollHref}
                      prefetch={false}
                      className="font-medium text-primary hover:underline"
                    >
                      {week.weekLabel}
                    </Link>
                  </td>
                  <td className="py-2 pr-2">{week.teamShortName}</td>
                  <td className="py-2 text-right tabular">{week.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="rounded-xl border bg-card shadow-xs">
        <div className="px-5 pt-5">
          <div className="font-display text-xl font-bold uppercase tracking-wide">
            No. 1 history
          </div>
          <p className="text-sm text-muted-foreground">
            Who held the top spot ({activeSeason.year})
          </p>
        </div>
        <div className="px-5 pb-5 pt-2">
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
                <span className="w-20 text-xs text-muted-foreground">
                  {week.weekLabel}
                </span>
                <span className="font-medium">{week.teamShortName}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
