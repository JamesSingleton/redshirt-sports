"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import CustomImage from "@/components/sanity-image";
import {
  groupTeamsByLetter,
  type TeamDirectorySchool,
} from "@/lib/team-directory";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function teamInitials(name: string): string {
  const words = name
    .split(/[\s-]+/)
    .filter(
      (part) =>
        part.length > 0 &&
        /^[a-z]/i.test(part) &&
        !["of", "the", "at"].includes(part.toLowerCase()),
    );
  return words
    .slice(0, 3)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function TeamCard({ team }: { team: TeamDirectorySchool }) {
  const displayName = team.shortName ?? team.name;

  return (
    <li data-team data-q={team.searchHaystack}>
      <Link
        href={`/college/teams/${team.slug}`}
        title={`/college/teams/${team.slug}`}
        className="group flex h-full items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        prefetch={false}
      >
        {team.image ? (
          <CustomImage
            image={team.image}
            width={48}
            height={48}
            className="size-12 shrink-0 object-contain"
            mode="contain"
          />
        ) : (
          <span
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-muted font-display text-sm font-bold text-muted-foreground"
            aria-hidden
          >
            {teamInitials(displayName)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold leading-tight group-hover:underline">
            {displayName}
          </span>
          {team.nickname ? (
            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
              {team.nickname}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function teamMatchesSearch(team: TeamDirectorySchool, query: string): boolean {
  return !query || team.searchHaystack.includes(query);
}

export function TeamsDirectory({ teams }: { teams: TeamDirectorySchool[] }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => groupTeamsByLetter(teams), [teams]);
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCount = useMemo(() => {
    return teams.filter((team) => teamMatchesSearch(team, normalizedQuery))
      .length;
  }, [teams, normalizedQuery]);

  const letterHasVisible = (letter: string) => {
    const group = groups.find((g) => g.letter === letter);
    if (!group) return false;
    return group.teams.some((team) => teamMatchesSearch(team, normalizedQuery));
  };

  return (
    <>
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-16 lg:-mx-6 lg:px-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <label htmlFor="team-q" className="sr-only">
              Search schools
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="team-q"
              type="search"
              autoComplete="off"
              placeholder="Search schools and nicknames"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent pr-3 pl-8 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <p
            className="text-sm text-muted-foreground sm:ml-auto"
            aria-live="polite"
          >
            {visibleCount} {visibleCount === 1 ? "school" : "schools"}
          </p>
        </div>
        <nav aria-label="Jump to letter" className="mt-2 overflow-x-auto">
          <ul className="flex gap-0.5">
            {LETTERS.map((letter) => {
              const enabled = letterHasVisible(letter);
              return (
                <li key={letter}>
                  {enabled ? (
                    <a
                      href={`#letter-${letter}`}
                      className="inline-flex size-8 items-center justify-center rounded-md text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {letter}
                    </a>
                  ) : (
                    <span
                      className="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground/40"
                      aria-hidden
                    >
                      {letter}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div id="teams-grid" className="grid gap-8 py-6">
        {groups.map((group) => {
          const visibleTeams = group.teams.filter((team) =>
            teamMatchesSearch(team, normalizedQuery),
          );

          if (visibleTeams.length === 0) {
            return null;
          }

          return (
            <section
              key={group.letter}
              data-group
              aria-labelledby={`letter-${group.letter}`}
              className="scroll-mt-24"
            >
              <h2
                id={`letter-${group.letter}`}
                className="sticky top-14 z-10 -mx-1 mb-3 border-b bg-background/95 px-1 py-2 font-display text-2xl font-extrabold uppercase backdrop-blur lg:top-16"
              >
                {group.letter}
              </h2>
              <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))]">
                {visibleTeams.map((team) => (
                  <TeamCard key={team._id} team={team} />
                ))}
              </ul>
            </section>
          );
        })}
        {visibleCount === 0 ? (
          <p
            className="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
            role="status"
          >
            No schools match. Try another name or clear the search.
          </p>
        ) : null}
      </div>
    </>
  );
}
