"use client";

import type { QueryTeamsIndexResult } from "@redshirt-sports/sanity/types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@redshirt-sports/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@redshirt-sports/ui/components/input-group";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@redshirt-sports/ui/components/toggle-group";
import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { FilterCombobox } from "@/components/filter-combobox";
import CustomImage from "@/components/sanity-image";

export type DirectoryTeam = QueryTeamsIndexResult["teams"][number];

type Conference = NonNullable<
  DirectoryTeam["affiliations"]
>[number]["conference"];

export type DirectorySport = QueryTeamsIndexResult["sports"][number];

type ConferenceGroup = {
  id: string;
  label: string;
  /** Full name, so search matches "Missouri Valley" as well as "MVFC". */
  name: string;
  teams: DirectoryTeam[];
};

const ALL = "all";

function conferenceLabel(conference: Conference) {
  return conference.shortName ?? conference.name ?? "Other";
}

function groupBySportConference(teams: DirectoryTeam[], sport: string) {
  const groups = new Map<string, ConferenceGroup>();
  for (const team of teams) {
    const conference = team.affiliations?.find(
      (affiliation) => affiliation.sport === sport,
    )?.conference;
    if (!conference) continue;
    const group = groups.get(conference._id) ?? {
      id: conference._id,
      label: conferenceLabel(conference),
      name: conference.name ?? "",
      teams: [],
    };
    group.teams.push(team);
    groups.set(conference._id, group);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function matchesQuery(team: DirectoryTeam, query: string) {
  if (!query) return true;
  return [team.name, team.shortName, team.nickname].some((value) =>
    value?.toLowerCase().includes(query),
  );
}

function TeamCard({ team }: { team: DirectoryTeam }) {
  return (
    <Link
      href={`/college/teams/${team.slug}` as Route}
      prefetch={false}
      className="bg-card hover:bg-accent flex items-center gap-3 rounded border p-3 transition-colors"
    >
      {team.image ? (
        <CustomImage
          image={team.image}
          width={40}
          height={40}
          mode="contain"
          className="size-10 shrink-0 object-contain"
        />
      ) : (
        <span className="bg-muted size-10 shrink-0 rounded" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">
          {team.shortName ?? team.name}
        </span>
        {team.nickname ? (
          <span className="text-muted-foreground truncate text-sm">
            {team.nickname}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Team hubs grouped by the selected sport's conference, with search and a conference filter. */
export function TeamsDirectory({
  teams,
  sports,
}: {
  teams: DirectoryTeam[];
  sports: DirectorySport[];
}) {
  const [sport, setSport] = useState(sports[0]?.slug ?? "");
  const [conferenceId, setConferenceId] = useState(ALL);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const groups = useMemo(
    () => groupBySportConference(teams, sport),
    [teams, sport],
  );

  const visibleGroups = groups.flatMap((group) => {
    if (conferenceId !== ALL && group.id !== conferenceId) return [];
    const matches = group.teams.filter((team) =>
      matchesQuery(team, deferredQuery),
    );
    return matches.length ? [{ ...group, teams: matches }] : [];
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ToggleGroup
          variant="outline"
          value={[sport]}
          onValueChange={([next]) => {
            if (!next) return;
            setSport(next);
            setConferenceId(ALL);
          }}
          aria-label="Sport"
          className="w-full md:w-auto"
        >
          {sports.map((entry) => (
            <ToggleGroupItem
              key={entry.slug}
              value={entry.slug}
              className="flex-1 px-3 md:flex-none"
            >
              {entry.title}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex flex-col gap-3 sm:flex-row">
          <InputGroup className="bg-card sm:w-64">
            <InputGroupInput
              type="search"
              placeholder="Search teams"
              aria-label="Search teams"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <FilterCombobox
            label="Conference"
            searchPlaceholder="Search conferences"
            options={[
              { value: ALL, label: "All conferences" },
              ...groups.map(({ id, label, name }) => ({
                value: id,
                label,
                keywords: name,
              })),
            ]}
            value={conferenceId}
            onValueChange={setConferenceId}
          />
        </div>
      </div>

      {visibleGroups.length ? (
        visibleGroups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`conference-${group.id}-heading`}
            className="flex flex-col gap-4"
          >
            <h2
              id={`conference-${group.id}-heading`}
              className="headline border-b pb-3 text-2xl"
            >
              {group.label}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.teams.map((team) => (
                <li key={team._id}>
                  <TeamCard team={team} />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <Empty className="bg-card rounded border">
          <EmptyHeader>
            <EmptyTitle>No teams found</EmptyTitle>
            <EmptyDescription>
              Try a different name or conference.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
