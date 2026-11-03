import { BracketEditionPicker } from "@/components/bracket/bracket-edition-picker";
import { BracketExplorer } from "@/components/bracket/bracket-explorer";
import {
  type BracketPageModel,
  bracketEditionLabel,
  bracketEditionPath,
  bracketPaths,
} from "@/lib/bracket-data";
import { sportNavLabel } from "@/lib/sport-nav";

export function bracketTitle(edition: BracketPageModel["edition"]) {
  const division = edition.divisionSlug?.toUpperCase();
  return division
    ? `${edition.year} ${division} Playoff Bracket`
    : `${edition.year} ${sportNavLabel(edition.sportSlug, "")} Playoff Bracket`;
}

/** Title, edition label, note, article link, season/bracket picker, bracket. */
export function BracketPageView({ model }: { model: BracketPageModel }) {
  const { edition, view, stats, official, projections, seasons } = model;
  const paths = bracketPaths(edition.sportSlug, edition.divisionSlug ?? "");
  const editions = [...(official ? [official] : []), ...projections];

  return (
    <div className="flex flex-col gap-6 pb-12">
      <header className="mx-auto flex w-full min-w-0 max-w-site flex-col gap-3 px-4 pt-6 lg:px-6">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          {bracketEditionLabel(edition)}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {bracketTitle(edition)}
        </h1>
        {edition.publicNote ? (
          <p className="max-w-prose text-muted-foreground text-sm">
            {edition.publicNote}
          </p>
        ) : null}
        {edition.articleUrl ? (
          <p className="text-sm">
            <a
              href={edition.articleUrl}
              className="font-medium underline underline-offset-4"
            >
              Read how we built this bracket
            </a>
          </p>
        ) : null}

        <BracketEditionPicker
          seasons={seasons.map((season) => ({
            year: season,
            href: paths.season(season),
          }))}
          year={edition.year}
          editions={editions.map((item) => ({
            href: bracketEditionPath(item),
            label:
              item.kind === "official"
                ? "Official bracket"
                : `Week ${item.weekNumber} projection`,
          }))}
          currentHref={bracketEditionPath(edition)}
        />
      </header>

      <section aria-label="Bracket" className="w-full min-w-0 px-4">
        <p className="mx-auto mb-3 w-full max-w-site text-muted-foreground text-xs">
          Select a game for kickoff, site and how the teams compare.
        </p>
        <BracketExplorer
          view={view}
          stats={stats}
          sport={edition.sportSlug}
          division={edition.divisionSlug ?? ""}
        />
      </section>

      {edition.kind === "projection" && edition.divisionSlug === "fcs" ? (
        <p className="mx-auto w-full max-w-site px-4 text-muted-foreground text-xs lg:px-6">
          A projection, not the NCAA field. Seeds 1–8 have first-round byes, and
          the higher seed hosts unless a game notes another site.
        </p>
      ) : null}
    </div>
  );
}
