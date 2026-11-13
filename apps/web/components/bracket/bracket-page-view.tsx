import Link from "next/link";

import { BracketEditionPicker } from "@/components/bracket/bracket-edition-picker";
import { BracketExplorer } from "@/components/bracket/bracket-explorer";
import {
  type BracketPageModel,
  bracketEditionPath,
  bracketPaths,
} from "@/lib/bracket-data";
import { sportNavLabel } from "@/lib/sport-nav";

type Edition = BracketPageModel["edition"];

function bracketName(edition: Edition) {
  const division = edition.divisionSlug?.toUpperCase();
  return division
    ? `${edition.year} ${division} Playoff Bracket`
    : `${edition.year} ${sportNavLabel(edition.sportSlug, "")} Playoff Bracket`;
}

/**
 * The page's h1 and meta title. A projection names its week, so each week's
 * page (and its search result) says which projection it is.
 */
export function bracketTitle(edition: Edition) {
  return edition.kind === "official"
    ? bracketName(edition)
    : `${bracketName(edition)} Projection After Week ${edition.weekNumber}`;
}

export function bracketDescription(edition: Edition) {
  const name = bracketName(edition);
  return edition.kind === "official"
    ? `The official ${name}: every seed, matchup, host and result, from Redshirt Sports.`
    : `If the playoffs started after Week ${edition.weekNumber}: our projected ${name}, with every seed, first-round matchup and host.`;
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
          {edition.kind === "official" ? "Official bracket" : "Projection"}
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
        <p className="text-sm">
          <Link
            href={paths.builder}
            prefetch={false}
            className="font-medium underline underline-offset-4"
          >
            Make your own bracket
          </Link>
        </p>
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
