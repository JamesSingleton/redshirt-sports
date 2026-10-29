"use client";

import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import type {
  RankingHistoryPoint,
  RankingHistoryPoll,
} from "@redshirt-sports/db/utils/school-ranking-history";
import {
  RANKING_HISTORY_CHART_DOMAIN_MAX,
  RANKING_HISTORY_RV_CHART_VALUE,
  rankingHistoryPointToChartValue,
} from "@redshirt-sports/db/utils/school-ranking-history";
import { Badge } from "@redshirt-sports/ui/components/badge";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@redshirt-sports/ui/components/chart";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  rank: {
    label: "Rank",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const Y_AXIS_TICKS = [1, 5, 10, 15, 20, 25, RANKING_HISTORY_RV_CHART_VALUE];

type ChartRow = {
  label: string;
  rankValue: number | null;
  displayRank: string;
};

function toChartRows(points: RankingHistoryPoint[]): ChartRow[] {
  return points.map((point) => ({
    label: point.label,
    rankValue: rankingHistoryPointToChartValue(point),
    displayRank:
      point.status === "ranked"
        ? `#${point.rank}`
        : point.status === "rv"
          ? "RV"
          : "NR",
  }));
}

function latestRankLabel(points: RankingHistoryPoint[]): string {
  const latest = [...points]
    .reverse()
    .find((point) => point.status === "ranked" || point.status === "rv");
  if (!latest) {
    return "NR";
  }
  return latest.status === "ranked" ? `#${latest.rank}` : "RV";
}

export function TeamPollRankInline({
  poll,
  teamName,
}: {
  poll: RankingHistoryPoll;
  teamName: string;
}) {
  const year = poll.years[0];
  const series = year != null ? (poll.seriesByYear[year] ?? []) : [];
  const chartData = toChartRows(series);
  const latest = latestRankLabel(series);
  const rankingsHref =
    year != null
      ? `/college/${poll.sportSlug}/rankings/${poll.pollSlug}/${year}/${formatWeekSegment(
          series.at(-1)?.legacyWeek ?? 1,
        )}`
      : `/college/${poll.sportSlug}/rankings/${poll.pollSlug}`;

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:items-center">
      <div className="text-center sm:text-left">
        <div className="kicker text-muted-foreground">
          {poll.pollName} · {year ?? "—"}
        </div>
        <div className="font-display text-4xl font-extrabold tabular-nums leading-none">
          {latest}
        </div>
        <Badge variant="secondary" className="mt-2">
          {teamName}
        </Badge>
        <Link
          href={rankingsHref}
          prefetch={false}
          className="mt-3 block text-sm font-bold tracking-wide text-destructive uppercase hover:underline"
        >
          View poll
        </Link>
      </div>
      {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-28 w-full min-w-0"
          initialDimension={{ width: 320, height: 112 }}
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              minTickGap={24}
              hide
            />
            <YAxis
              reversed
              domain={[1, RANKING_HISTORY_CHART_DOMAIN_MAX]}
              ticks={Y_AXIS_TICKS}
              tickLine={false}
              axisLine={false}
              width={28}
              tickFormatter={(value) =>
                value === RANKING_HISTORY_RV_CHART_VALUE ? "RV" : String(value)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label ?? ""
                  }
                  formatter={(_, __, item) => item.payload.displayRank}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="rankValue"
              stroke="var(--color-rank)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <p className="text-sm text-muted-foreground">
          No ranking history published yet.
        </p>
      )}
    </div>
  );
}
