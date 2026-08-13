"use client";

import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import type {
  RankingHistoryPoint,
  RankingHistoryPoll,
  SchoolRankingHistory,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@redshirt-sports/ui/components/tabs";
import Link from "next/link";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  rank: {
    label: "Rank",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

// Landmark ranks only — every integer felt cramped. Exact ranks still
// show in the tooltip / dots; the axis is for orientation.
const Y_AXIS_TICKS = [1, 5, 10, 15, 20, 25, RANKING_HISTORY_RV_CHART_VALUE];

type ChartRow = {
  label: string;
  legacyWeek: number;
  rankValue: number | null;
  status: RankingHistoryPoint["status"];
  points: number | null;
  displayRank: string;
};

function toChartRows(points: RankingHistoryPoint[]): ChartRow[] {
  return points.map((point) => ({
    label: point.label,
    legacyWeek: point.legacyWeek,
    rankValue: rankingHistoryPointToChartValue(point),
    status: point.status,
    points: point.points,
    displayRank:
      point.status === "ranked"
        ? `#${point.rank}`
        : point.status === "rv"
          ? "RV"
          : "NR",
  }));
}

function summarizeSeries(points: RankingHistoryPoint[]) {
  const ranked = points.filter(
    (p): p is RankingHistoryPoint & { rank: number } =>
      p.status === "ranked" && p.rank != null,
  );
  const peak = ranked.reduce<number | null>(
    (best, point) => (best == null || point.rank < best ? point.rank : best),
    null,
  );
  const latestInPoll = [...points]
    .reverse()
    .find((p) => p.status === "ranked" || p.status === "rv");
  const weeksRanked = ranked.length;

  return {
    peak,
    latest: latestInPoll
      ? latestInPoll.status === "ranked"
        ? `#${latestInPoll.rank}`
        : "RV"
      : "NR",
    weeksRanked,
    latestWeek: latestInPoll?.legacyWeek ?? null,
  };
}

function pollTabLabel(poll: RankingHistoryPoll) {
  return `${poll.sportTitle} ${poll.pollName}`;
}

function RankDot(props: { cx?: number; cy?: number; payload?: ChartRow }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload || payload.rankValue == null) {
    return null;
  }

  const isRv = payload.status === "rv";
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isRv ? 6 : 5}
      fill={isRv ? "var(--muted-foreground)" : "var(--color-rank)"}
      stroke="var(--background)"
      strokeWidth={2}
    />
  );
}

function PollRankingChart({
  poll,
  teamName,
}: {
  poll: RankingHistoryPoll;
  teamName: string;
}) {
  const [year, setYear] = useState(String(poll.years[0] ?? ""));
  const yearNumber = Number(year);
  const series = poll.seriesByYear[yearNumber] ?? [];
  const chartData = toChartRows(series);
  const summary = summarizeSeries(series);

  const rankingsHref =
    summary.latestWeek != null
      ? `/college/${poll.sportSlug}/rankings/${poll.pollSlug}/${yearNumber}/${formatWeekSegment(summary.latestWeek)}`
      : `/college/${poll.sportSlug}/rankings/${poll.pollSlug}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Latest {summary.latest}</Badge>
          {summary.peak != null ? (
            <Badge variant="outline">Peak #{summary.peak}</Badge>
          ) : null}
          <Badge variant="outline">{summary.weeksRanked} weeks ranked</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {poll.years.length > 1 ? (
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-37.5" size="sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {poll.years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">{year}</span>
          )}
          <Link
            href={rankingsHref}
            className="text-xs font-bold tracking-wide text-destructive-foreground uppercase hover:underline"
          >
            View rankings
          </Link>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published rankings for {teamName} in {year}.
        </p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-125 w-full"
          initialDimension={{ width: 640, height: 400 }}
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={16}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[1, RANKING_HISTORY_CHART_DOMAIN_MAX]}
              reversed
              ticks={Y_AXIS_TICKS}
              interval={0}
              allowDataOverflow
              tickFormatter={(value: number) =>
                value === RANKING_HISTORY_RV_CHART_VALUE ? "RV" : String(value)
              }
              tickLine={false}
              axisLine={false}
              width={36}
              fontSize={11}
            />
            <ReferenceLine
              y={25.5}
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const row = item?.payload as ChartRow | undefined;
                    if (!row) return null;
                    // Points intentionally omitted. Voter turnout varies
                    // week to week, so a lower point total doesn't
                    // necessarily mean a worse week, comparing raw points
                    // across weeks would be misleading here.
                    const rankText =
                      row.status === "ranked"
                        ? `Rank ${row.displayRank}`
                        : row.status === "rv"
                          ? "Receiving votes"
                          : "Unranked";
                    return <span className="font-medium">{rankText}</span>;
                  }}
                />
              }
            />
            <Line
              dataKey="rankValue"
              type="monotone"
              stroke="var(--color-rank)"
              strokeWidth={2}
              connectNulls={false}
              dot={RankDot}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  );
}

export function TeamRankingHistory({
  history,
  teamName,
}: {
  history: SchoolRankingHistory;
  teamName: string;
}) {
  if (history.polls.length === 0) {
    return null;
  }

  const defaultPollId = history.polls[0]!.pollId;

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-[22px] font-bold text-foreground">
          {teamName} Top 25 History
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly Redshirt Sports poll ranking — up, down, into, and out of the
          Top 25.
        </p>
      </div>

      <div className="p-4">
        {history.polls.length === 1 ? (
          <PollRankingChart poll={history.polls[0]!} teamName={teamName} />
        ) : (
          <Tabs defaultValue={defaultPollId}>
            <TabsList variant="line" className="mb-4 w-full justify-start">
              {history.polls.map((poll) => (
                <TabsTrigger key={poll.pollId} value={poll.pollId}>
                  {pollTabLabel(poll)}
                </TabsTrigger>
              ))}
            </TabsList>
            {history.polls.map((poll) => (
              <TabsContent key={poll.pollId} value={poll.pollId}>
                <PollRankingChart poll={poll} teamName={teamName} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
}
