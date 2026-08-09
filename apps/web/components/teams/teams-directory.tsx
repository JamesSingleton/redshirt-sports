"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Input } from "@redshirt-sports/ui/components/input";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import CustomImage from "@/components/sanity-image";
import type { TeamsDirectoryQueryResult } from "@redshirt-sports/sanity/types";

export type DirectoryConference = {
  abbreviation: string;
  name: string;
};

export type DirectoryTeam = TeamsDirectoryQueryResult[number];

function teamSearchHaystack(team: DirectoryTeam) {
  return [
    team.name,
    team.shortName,
    team.abbreviation,
    team.nickname,
    team.primaryConference?.name,
    team.primaryConference?.abbreviation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function TeamsDirectory({
  teams,
  conferences,
}: {
  teams: DirectoryTeam[];
  conferences: DirectoryConference[];
}) {
  const [query, setQuery] = useState("");
  const [activeConference, setActiveConference] = useState<string>("all");
  console.log("[v0] TeamsDirectory render, activeConference:", activeConference);

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesConference =
        activeConference === "all" ||
        team.primaryConference?.abbreviation === activeConference;

      if (!matchesConference) return false;
      if (!normalizedQuery) return true;

      return teamSearchHaystack(team).includes(normalizedQuery);
    });
  }, [teams, query, activeConference]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative mb-6">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your team"
          aria-label="Search your team"
          autoComplete="off"
          className="h-12 rounded-lg pl-11 text-base"
        />
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter teams by conference"
      >
        <FilterPill
          label="All"
          isActive={activeConference === "all"}
          onClick={() => setActiveConference("all")}
        />
        {conferences.map((conference) => (
          <FilterPill
            key={conference.abbreviation}
            label={conference.abbreviation}
            title={conference.name}
            isActive={activeConference === conference.abbreviation}
            onClick={() => setActiveConference(conference.abbreviation)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm text-muted-foreground">
            {filteredTeams.length}{" "}
            {filteredTeams.length === 1 ? "team" : "teams"}
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            A&ndash;Z by team
          </span>
        </div>

        {filteredTeams.length > 0 ? (
          <ul className="divide-y divide-border">
            {filteredTeams.map((team) => (
              <TeamRow key={team._id} team={team} />
            ))}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No teams match &ldquo;{query}&rdquo;. Try a different search.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  title,
  isActive,
  onClick,
}: {
  label: string;
  title?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function TeamRow({ team }: { team: DirectoryTeam }) {
  const displayName = team.shortName ?? team.name ?? "Unknown Team";
  const subtitleParts = [team.nickname, team.primaryConference?.shortName]
    .filter(Boolean)
    .join(" \u00b7 ");

  return (
    <li>
      <Link
        href={`/college/teams/${team.slug}`}
        className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {team.image ? (
            <CustomImage
              image={team.image}
              width={40}
              height={40}
              className="size-full object-contain p-1"
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-foreground">
            {displayName}
          </span>
          {subtitleParts ? (
            <span className="block truncate text-sm text-muted-foreground">
              {subtitleParts}
            </span>
          ) : null}
        </span>

        {team.primaryConference?.abbreviation ? (
          <Badge variant="secondary" className="shrink-0">
            {team.primaryConference.abbreviation}
          </Badge>
        ) : null}

        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Link>
    </li>
  );
}
