"use client";

import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import { Input } from "@redshirt-sports/ui/components/input";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import CustomImage from "@/components/sanity-image";
import { schoolMatchScore } from "@/components/virtualized-combobox";

type School = SchoolsBySportAndSubgroupingStringQueryResult[number];

/** A school's conference, short name first, or `undefined` without one. */
export function conferenceOf(school: School) {
  const conference = school.conferenceInfo?.conference;
  return conference?.shortName ?? conference?.name ?? undefined;
}

type EligibleTeamsProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  /** The ballot, one school id per rank with `""` for an empty one. */
  ballot: readonly string[];
  /** The voter's own rank for each school last week. */
  lastWeek: ReadonlyMap<string, number>;
  onAdd: (team: string) => void;
  className?: string;
};

/**
 * Every school eligible for the poll, searchable and filtered by conference.
 * Schools on the ballot say where they are; the rest have an add button.
 */
export function EligibleTeams({
  schools,
  ballot,
  lastWeek,
  onAdd,
  className,
}: EligibleTeamsProps) {
  const [query, setQuery] = useState("");
  const [conference, setConference] = useState<string | null>(null);
  const full = !ballot.includes("");

  const conferences = useMemo(
    () =>
      [
        ...new Set(
          schools.map(conferenceOf).filter((name): name is string => !!name),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [schools],
  );

  const shown = schools.filter(
    (school) =>
      (!conference || conferenceOf(school) === conference) &&
      schoolMatchScore(
        {
          value: school._id,
          label: school.shortName ?? school.name,
          keywords: [school.name, school.abbreviation ?? ""],
        },
        query,
      ),
  );

  return (
    <section
      aria-labelledby="eligible-teams-title"
      className={cn("flex min-h-0 flex-col gap-3", className)}
    >
      <div>
        <h2
          id="eligible-teams-title"
          className="font-display text-xl font-bold uppercase"
        >
          Eligible teams
        </h2>
        <p className="text-sm text-muted-foreground">
          {schools.length} teams · search or filter
        </p>
      </div>
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search teams"
          placeholder="Search teams"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 pl-9"
        />
      </div>
      {conferences.length > 1 ? (
        <div
          role="group"
          aria-label="Conference"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
        >
          {[null, ...conferences].map((name) => (
            <button
              key={name ?? "all"}
              type="button"
              aria-pressed={conference === name}
              onClick={() => setConference(name)}
              className="shrink-0 rounded-md border px-2.5 py-1 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {name ?? "All"}
            </button>
          ))}
        </div>
      ) : null}
      {full ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Your ballot is full. Remove a team to add another, or pick a team for
          a rank to insert it there.
        </p>
      ) : null}
      {shown.length ? (
        <ul
          aria-label="Eligible teams"
          className="min-h-0 divide-y overflow-y-auto overscroll-contain"
        >
          {shown.map((school) => {
            const name = school.shortName ?? school.name;
            const rank = ballot.indexOf(school._id) + 1;
            const previous = lastWeek.get(school._id);
            const meta = [
              conferenceOf(school),
              previous ? `your #${previous} last week` : undefined,
            ].filter(Boolean);
            return (
              <li
                key={school._id}
                className={cn(
                  "flex items-center gap-3 py-2",
                  rank && "text-muted-foreground",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center">
                  {school.image ? (
                    <CustomImage
                      image={school.image}
                      width={32}
                      height={32}
                      className="size-7 object-contain"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  {meta.length ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {meta.join(" · ")}
                    </span>
                  ) : null}
                </span>
                {rank ? (
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs">
                    On ballot · #{rank}
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Add ${name}`}
                    aria-disabled={full || undefined}
                    onClick={() => !full && onAdd(school._id)}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                  >
                    <PlusIcon aria-hidden className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No team found.
        </p>
      )}
    </section>
  );
}
