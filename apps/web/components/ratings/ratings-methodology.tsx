import type { EngineConfig } from "@redshirt-sports/db/ratings/engine";
import { normalCdf } from "@redshirt-sports/db/ratings/engine";
import Link from "next/link";
import type { ReactNode } from "react";

export type MethodologyPool = {
  /** "FCS football" */
  label: string;
  /** "FCS" */
  name: string;
  /** "football-fcs", used as the parameter table's anchor. */
  anchor: string;
  config: EngineConfig;
  methodVersion: number;
  ratingsHref: string;
  accuracyHref: string;
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display mb-3 text-2xl font-bold">{title}</h2>
      <div className="flex flex-col gap-3 leading-relaxed">{children}</div>
    </section>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="bg-card rounded-xl border p-4 font-mono text-sm leading-relaxed">
      {children}
    </p>
  );
}

const SECTIONS = [
  ["pools", "Only same-level games count"],
  ["strength", "Team strength"],
  ["sos", "Strength of schedule"],
  ["sor", "Strength of record"],
  ["power", "Power"],
  ["more", "SOV, record SOS, tiers"],
  ["uncertainty", "Early season"],
  ["data", "Data and publishing"],
  ["parameters", "Each pool's numbers"],
] as const;

export function parameterRows(config: EngineConfig): Array<[string, string]> {
  const cap =
    config.marginTransform.type === "cap"
      ? `${config.marginTransform.cap} points`
      : "logarithmic";
  return [
    ["Margin cap", cap],
    ["Overtime margin", `${config.overtimeMargin} points`],
    ["Starting-point weight", `${config.priorGames} games`],
    ["Last season carried over", `${Math.round(config.priorCarryover * 100)}%`],
    ["New member start", `${config.newcomerPrior} points`],
    ["Home field starting guess", `${config.homeFieldPrior} points`],
    [
      "Power recency",
      config.powerHalfLifeWeeks == null
        ? "every game counts equally"
        : `half weight after ${config.powerHalfLifeWeeks} weeks`,
    ],
    ["Game noise (σ)", `${config.sigma.toFixed(2)} points`],
    ["Typical #25 team (B)", `${config.benchmark.toFixed(2)} points`],
    ["Games needed for a rank", String(config.minRankedGames)],
    ["Tier cutoffs (p)", config.tierFloors.join(", ")],
  ];
}

/**
 * The method, once, for every pool. Each pool's fitted numbers are in the
 * table at the end; the worked examples use the first pool's numbers.
 */
export function RatingsMethodology({ pools }: { pools: MethodologyPool[] }) {
  const example = pools[0];
  if (!example) return null;
  const { config } = example;
  const sigma = config.sigma.toFixed(2);
  const benchmark = config.benchmark.toFixed(2);
  const exampleP = normalCdf((5 + 2) / config.sigma);

  return (
    <div className="flex flex-col gap-10 py-6 lg:flex-row">
      <nav
        aria-label="On this page"
        className="top-24 h-fit shrink-0 text-sm lg:sticky lg:w-56"
      >
        <ol className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex max-w-3xl min-w-0 flex-col gap-10">
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How the ratings and strength of schedule work
          </h1>
          <p className="text-muted-foreground mt-2">
            Three separate numbers answer three separate questions.{" "}
            <strong>Strength of record</strong>: who has earned it.{" "}
            <strong>Power</strong>: who is better.{" "}
            <strong>Strength of schedule</strong>: who played whom. The method
            is the same for every sport and level; only a few fitted numbers
            differ, listed at the end. Every input behind every number is on
            each team's sheet, so anything can be checked by hand.
          </p>
        </header>

        <Section id="pools" title="Only same-level games count">
          <p>
            Each set of ratings covers one group of teams, like FCS football.
            Every number uses only games where{" "}
            <strong>both teams are in that group that season</strong>. For FCS,
            a trip to an FBS power is left out, so buying one doesn't inflate a
            schedule. A game against a Division II or III school is left out
            too, so scheduling one doesn't drag a schedule down. Those games
            still appear on each team sheet, labeled with the opponent's level,
            for example "Arizona (FBS)".
          </p>
          <p>
            Strength of schedule is an <strong>average per game</strong>, not a
            total. A team that has played eight FCS opponents and one that has
            played five are measured on the same scale: how hard each game was,
            on average.
          </p>
          <p>
            The ratings use only game results. They don't use any poll,
            including ours.
          </p>
        </Section>

        <Section id="strength" title="Team strength">
          <p>
            Each team gets a strength in points: how many points better than an
            average team in its group on a neutral field. Strengths come from
            the margin of every counted game:
          </p>
          <Formula>
            margin(home − away) ≈ strength(home) − strength(away) + home field
          </Formula>
          <ul className="list-disc pl-5">
            <li>
              Margins count up to a cap (for {example.label},{" "}
              {parameterRows(config)[0]?.[1]}). Running up the score earns
              nothing past it.
            </li>
            <li>
              An overtime game counts as at most {config.overtimeMargin} points
              either way, because overtime is close to a coin flip.
            </li>
            <li>
              Home field is estimated from the games each week. The fitted value
              is printed with every run, and neutral-site games get none.
            </li>
            <li>
              Before any games, each team starts at a share of its final
              strength last season. That starting point counts like a couple of
              games, so by midseason a team's own results dominate. A team new
              to the group starts below average, because reclassifying programs
              usually are.
            </li>
            <li>
              The math is least squares with that starting point (Bayesian ridge
              regression). Strengths are centered so the average team is 0.
            </li>
          </ul>
          <p>
            For schedule numbers, each opponent's strength is computed{" "}
            <strong>without its games against the team being measured</strong>.
            Blowing a team out lowers that team's strength, and it shouldn't
            also lower your own schedule. The NCAA's RPI does the same thing by
            dropping head-to-head games.
          </p>
        </Section>

        <Section id="sos" title="Strength of schedule">
          <p>
            Every schedule number is measured against one fixed yardstick, a{" "}
            <strong>#25-level team</strong>: a team as strong as the 25th-best
            team in these ratings usually is at the end of a season (strength B,
            the median over recent seasons). It comes from these ratings, not
            from any poll, and it stays fixed for each method version. For each
            counted game, ask how often a #25-level team would lose it:
          </p>
          <Formula>
            p = Φ( (opponent strength + opponent's site edge − B) / σ )
            <br />
            SOS = average p over the team's counted games, shown 0–100
          </Formula>
          <p>
            Φ is the normal curve. σ is how many points a game typically misses
            its expected margin by, fitted from past results. The opponent's
            site edge is plus home field if they hosted, minus it if they
            visited, and zero on a neutral field.
          </p>
          <p>
            Example for {example.label} (B = {benchmark}, σ = {sigma}): an
            opponent 5 points better than a #25-level team, at their place
            (about +2), gives p = Φ(7 / {sigma}) = {exampleP.toFixed(3)}. That
            game adds {(exampleP * 100).toFixed(1)} to the average.
          </p>
          <p>
            Why a #25-level yardstick instead of averaging opponent strengths?
            For a contender, one great opponent plus one terrible one isn't the
            same as two average games, and a plain average would treat them as
            equal. The yardstick is fixed for each method version, so a
            schedule's SOS moves only when its opponents' strengths move.
          </p>
          <p>
            Remaining SOS uses the same p for unplayed games. Teams need{" "}
            {config.minRankedGames} counted games for an SOS rank; below that
            the value shows as a small sample.
          </p>
        </Section>

        <Section id="sor" title="Strength of record">
          <p>
            Strength of record asks how hard this team's record was to get. Give
            a #25-level team this exact schedule, at these sites, and work out
            the exact chance it wins at least as many games:
          </p>
          <Formula>
            SOR = P( #25-level team wins ≥ this team's wins ), winning each game
            with probability 1 − p
          </Formula>
          <p>
            Lower is more impressive. Going 10-0 against a strong schedule might
            be 4%; against a weak one, 30%. Rank 1 is the lowest SOR. A team's
            own margins never enter, only its wins and losses. This is the
            default order of the ratings table.
          </p>
        </Section>

        <Section id="power" title="Power">
          <p>
            Power is the number for predicting games: a team's strength in
            points. Team A is expected to beat Team B on a neutral field by
            Power(A) − Power(B). Recent games can count a little more; each
            pool's setting is in the table below.
          </p>
        </Section>

        <Section id="more" title="Strength of victory, record SOS, and tiers">
          <p>
            <strong>Strength of victory (SOV)</strong> is SOS over wins only:
            how good were the teams it beat. Strength of loss, SOS over losses,
            is on each team sheet. Higher means more forgivable losses.
          </p>
          <p>
            <strong>Record SOS</strong> is the NCAA RPI's schedule part, from
            records only and counted games only: two-thirds opponents' win
            percentage plus one-third their opponents' win percentage, leaving
            out games against the team itself. It's a cross-check anyone can
            reproduce in a spreadsheet.
          </p>
          <p>
            <strong>Tiers</strong> sort each game by p, which already includes
            the site. Tier 1: the opponent, at that site, would be favored over
            a #25-level team. Tier 2: it beats that team 25–50% of the time.
            Tier 3: 10–25%. Tier 4: under 10%. Each team sheet shows its record
            in each tier, like the quadrants on NCAA basketball team sheets.
          </p>
        </Section>

        <Section id="uncertainty" title="Early season">
          <p>
            Ratings are estimates, and early in the season they lean on last
            season. Until the teams in a group are connected by games, or
            average fewer than {config.provisionalMinAverageGames} games each,
            the whole table is marked provisional. Each team sheet also shows a
            likely range for its Power rank, from {config.posteriorSamples}{" "}
            plausible sets of strengths drawn from the fit's margin of error.
          </p>
        </Section>

        <Section id="data" title="Data and publishing">
          <ul className="list-disc pl-5">
            <li>
              Scores, sites, and overtime come from ESPN. If ESPN is down during
              a weekend, final scores from NCAA.com fill in until ESPN returns.
            </li>
            <li>
              Who is in each group, and each team's conference, come from ESPN
              for that season, so moves between levels and conferences are
              handled.
            </li>
            <li>
              Ratings publish on their own once every game that has kicked off
              that week is final and nothing else starts within a day, usually
              early Sunday morning. Late corrections are picked up Monday and
              Tuesday.
            </li>
            <li>
              Each published week is kept exactly as published, with its method
              version and a checksum of every input.
            </li>
          </ul>
        </Section>

        <Section id="parameters" title="Each pool's numbers">
          <p>
            These were chosen by replaying past seasons: rate with only the
            games played so far, predict the next week, score the predictions,
            and keep the settings that predicted best. The season after the ones
            used to choose them is the honest test. See each pool's accuracy
            page.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr>
                  <th className="py-1.5 pr-4" scope="col">
                    Setting
                  </th>
                  {pools.map((pool) => (
                    <th
                      key={pool.anchor}
                      id={pool.anchor}
                      className="py-1.5 pr-4"
                      scope="col"
                    >
                      <Link href={pool.ratingsHref} className="hover:underline">
                        {pool.label}
                      </Link>
                      <span className="text-muted-foreground block text-xs font-normal">
                        method v{pool.methodVersion} ·{" "}
                        <Link href={pool.accuracyHref} className="underline">
                          accuracy
                        </Link>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parameterRows(config).map(([label], row) => (
                  <tr key={label} className="border-t">
                    <th
                      scope="row"
                      className="py-1.5 pr-4 text-left font-normal"
                    >
                      {label}
                    </th>
                    {pools.map((pool) => (
                      <td key={pool.anchor} className="py-1.5 pr-4 font-mono">
                        {parameterRows(pool.config)[row]?.[1]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}
