import type { PublishedTeamRow } from "@redshirt-sports/db/ratings";
import Link from "next/link";

import { TeamLogo } from "@/components/ratings/team-logo";
import {
  formatPoints,
  formatRankRange,
  formatRecord,
  formatScore,
  formatSor,
  siteLabel,
} from "@/lib/ratings/format";

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {detail ? (
        <p className="text-muted-foreground text-xs">{detail}</p>
      ) : null}
    </div>
  );
}

/** Short name and plain meaning for each tier; p is the chance a #25-level team loses. */
export const TIERS = [
  {
    name: "#25-level or better",
    meaning: "Would be favored over a #25-level team",
  },
  { name: "Strong", meaning: "Beats a #25-level team 25–50% of the time" },
  { name: "Middle", meaning: "Beats a #25-level team 10–25% of the time" },
  {
    name: "Weak",
    meaning: "Beats a #25-level team under 10% of the time",
  },
] as const;

/** What tiers mean. Shown once per page, not once per team. */
export function TierLegend() {
  return (
    <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-2">
      {TIERS.map((tier, index) => (
        <div key={tier.name} className="flex gap-1">
          <dt className="text-foreground font-medium">
            Tier {index + 1}, {tier.name}:
          </dt>
          <dd>{tier.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One team's sheet: every number, and every game that produced it, so any
 * figure can be checked by hand.
 */
export function TeamSheet({
  row,
  poolName,
  teamCount,
  opponentHref,
  benchmark,
  sigma,
  showTierLegend = true,
}: {
  row: PublishedTeamRow;
  poolName: string;
  teamCount: number;
  opponentHref: (schoolId: string) => string | null;
  benchmark: number;
  sigma: number;
  /** Print view shows the tier legend once at the top instead. */
  showTierLegend?: boolean;
}) {
  const games = row.explanation.games;
  return (
    <article className="flex flex-col gap-6 break-inside-avoid-page">
      <div className="flex items-center gap-3">
        <TeamLogo
          image={row.image}
          name={row.name}
          abbreviation={row.abbreviation}
          size="md"
        />
        <div>
          <h2 className="font-display text-2xl font-bold">{row.name}</h2>
          <p className="text-muted-foreground text-sm">
            {row.conference ? `${row.conference} · ` : ""}
            {formatRecord(row.poolRecord)} vs {poolName} ·{" "}
            {formatRecord(row.overallRecord)} overall
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric
          label="Strength of record"
          value={row.sorRank ? `#${row.sorRank}` : "—"}
          detail={`A #25-level team matches it ${formatSor(row.sor)} of the time`}
        />
        <Metric
          label="Power"
          value={`#${row.powerRank}`}
          detail={`${formatPoints(row.power)} pts · likely #${formatRankRange(row.powerRankLow, row.powerRankHigh)}`}
        />
        <Metric
          label="Strength of schedule"
          value={formatScore(row.sos)}
          detail={
            row.sosRank
              ? `#${row.sosRank} of ${teamCount}`
              : "Unranked: too few games"
          }
        />
        <Metric
          label="Strength of victory"
          value={formatScore(row.sov)}
          detail={
            row.sovRank ? `#${row.sovRank}` : `${row.poolRecord.wins} wins`
          }
        />
        <Metric
          label="Record SOS"
          value={row.recordSos == null ? "—" : row.recordSos.toFixed(3)}
          detail={
            row.owp == null
              ? null
              : `Opp. ${(row.owp * 100).toFixed(1)}% · Opp. opp. ${((row.oowp ?? 0) * 100).toFixed(1)}%`
          }
        />
        <Metric
          label="Remaining SOS"
          value={formatScore(row.remainingSos)}
          detail={`${row.explanation.remaining.length} games left`}
        />
      </div>

      <section>
        <h3 className="mb-2 font-semibold">Record by opponent quality</h3>
        <ol className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {row.tierRecords.map((record, index) => {
            const tier = TIERS[index] as (typeof TIERS)[number];
            return (
              <li
                key={tier.name}
                className="rounded-lg border p-3"
                title={tier.meaning}
              >
                <p className="text-muted-foreground text-xs uppercase">
                  Tier {index + 1}
                </p>
                <p className="text-sm font-medium">{tier.name}</p>
                <p className="font-display text-2xl font-bold tabular-nums">
                  {formatRecord(record)}
                </p>
              </li>
            );
          })}
        </ol>
        {showTierLegend ? <TierLegend /> : null}
      </section>

      <section>
        <h3 className="mb-1 font-semibold">Counted games ({games.length})</h3>
        <p className="text-muted-foreground mb-2 text-xs">
          Opponent strength leaves out every game against {row.name}. p =
          Φ((strength + site − {benchmark.toFixed(2)}) / {sigma.toFixed(2)}),
          the chance a #25-level team loses that game. SOS is the average p; SOV
          is the average over wins.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-muted-foreground text-left text-xs">
              <tr>
                <th className="py-1 pr-3">Wk</th>
                <th className="py-1 pr-3">Opponent</th>
                <th className="py-1 pr-3">Result</th>
                <th className="py-1 pr-3 text-right">Opp. strength</th>
                <th className="py-1 pr-3 text-right">Site</th>
                <th className="py-1 pr-3 text-right">p</th>
                <th className="py-1 pr-3 text-right">Tier</th>
                <th
                  className="py-1 text-right"
                  title="This game's single-game power: margin plus opponent power, adjusted for site"
                >
                  Game power
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => {
                const href = opponentHref(game.opponentId);
                return (
                  <tr key={game.gameId} className="border-t">
                    <td className="py-1 pr-3 tabular-nums">{game.weekIndex}</td>
                    <td className="py-1 pr-3">
                      {siteLabel(game.site)}{" "}
                      {href ? (
                        <Link href={href} className="hover:underline">
                          {game.opponentName}
                        </Link>
                      ) : (
                        game.opponentName
                      )}
                    </td>
                    <td className="py-1 pr-3 tabular-nums">
                      {game.result === "win"
                        ? "W"
                        : game.result === "loss"
                          ? "L"
                          : "T"}{" "}
                      {game.pointsFor}-{game.pointsAgainst}
                      {game.overtime ? " OT" : ""}
                    </td>
                    <td className="py-1 pr-3 text-right tabular-nums">
                      {formatPoints(game.opponentStrength)}
                    </td>
                    <td className="py-1 pr-3 text-right tabular-nums">
                      {formatPoints(game.opponentSiteEdge)}
                    </td>
                    <td className="py-1 pr-3 text-right tabular-nums">
                      {game.p.toFixed(3)}
                    </td>
                    <td className="py-1 pr-3 text-right">{game.tier}</td>
                    <td className="py-1 text-right tabular-nums">
                      {formatPoints(game.performance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {row.explanation.remaining.length > 0 ? (
        <section>
          <h3 className="mb-2 font-semibold">Remaining {poolName} games</h3>
          <ul className="text-sm">
            {row.explanation.remaining.map((game) => (
              <li key={game.gameId}>
                Wk {game.weekIndex}: {siteLabel(game.site)} {game.opponentName}{" "}
                · p {game.p.toFixed(3)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {row.explanation.excluded.length > 0 ? (
        <section>
          <h3 className="mb-2 font-semibold">
            Not counted (opponent not {poolName})
          </h3>
          <ul className="text-muted-foreground text-sm">
            {row.explanation.excluded.map((game) => (
              <li key={game.gameId}>
                Wk {game.weekIndex}: {siteLabel(game.site)} {game.opponentName}
                {game.opponentLevel ? (
                  <span className="text-foreground/80 ml-1.5 rounded border px-1 py-px text-[0.65rem] font-medium tracking-wide uppercase">
                    {game.opponentLevel}
                  </span>
                ) : null}
                {game.pointsFor != null && game.pointsAgainst != null
                  ? ` · ${game.result === "win" ? "W" : game.result === "loss" ? "L" : "T"} ${game.pointsFor}-${game.pointsAgainst}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
