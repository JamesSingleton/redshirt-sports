"use client";

import type { TeamRatingsHistory } from "@redshirt-sports/db/ratings";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@redshirt-sports/ui/components/chart";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  formatPoints,
  formatScore,
  formatSor,
  ratingsPaths,
} from "@/lib/ratings/format";

const chartConfig = {
  sorRank: { label: "SOR rank", color: "var(--chart-1)" },
  powerRank: { label: "Power rank", color: "var(--chart-2)" },
} satisfies ChartConfig;

function rank(value: number | null) {
  return value == null ? "—" : `#${value}`;
}

/** Current SOR, Power and SOS with a week-by-week rank trend, for the team page. */
export function TeamRatingsInline({
  ratings,
  teamSlug,
}: {
  ratings: TeamRatingsHistory;
  teamSlug: string | null;
}) {
  const { pool, year, teamCount, weeks } = ratings;
  const latest = weeks.at(-1);
  if (!latest) return null;
  const paths = ratingsPaths(pool.sportSlug, pool.slug);
  const stats = [
    { label: "SOR", rank: latest.sorRank, value: formatSor(latest.sor) },
    {
      label: "Power",
      rank: latest.powerRank,
      value: `${formatPoints(latest.power)} pts`,
    },
    { label: "SOS", rank: latest.sosRank, value: formatScore(latest.sos) },
  ];

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="kicker text-muted-foreground">
          {pool.name} computer ratings · {year} {latest.label}
        </div>
        <div className="flex gap-4">
          {teamSlug ? (
            <Link
              href={paths.team(teamSlug)}
              prefetch={false}
              className="text-sm font-bold tracking-wide text-destructive uppercase hover:underline"
            >
              Full team sheet
            </Link>
          ) : null}
          <Link
            href={paths.latest}
            prefetch={false}
            className="text-sm font-bold tracking-wide text-muted-foreground uppercase hover:underline"
          >
            All ratings
          </Link>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-muted/50 p-3">
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {stat.label}
            </dt>
            <dd className="font-display text-3xl font-extrabold tabular-nums leading-tight">
              {rank(stat.rank)}
            </dd>
            <dd className="text-xs text-muted-foreground tabular-nums">
              {stat.value} · of {teamCount}
            </dd>
          </div>
        ))}
      </dl>
      {weeks.length > 1 ? (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-40 w-full min-w-0"
          initialDimension={{ width: 480, height: 160 }}
        >
          <LineChart
            accessibilityLayer
            data={weeks}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              minTickGap={24}
              tickFormatter={(label: string) => label.replace("Week ", "W")}
            />
            <YAxis
              reversed
              interval={0}
              domain={[1, teamCount]}
              ticks={[1, 25, 50, 75, 100, teamCount].filter(
                (tick, index, all) =>
                  tick <= teamCount && all.indexOf(tick) === index,
              )}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    `${chartConfig[name as keyof typeof chartConfig].label} #${value}`
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {(["sorRank", "powerRank"] as const).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
      ) : null}
    </div>
  );
}
