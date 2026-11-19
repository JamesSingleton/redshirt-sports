"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { whenSelected } from "@redshirt-sports/ui/lib/utils";
import { useEffect, useMemo, useState } from "react";

import {
  type BallotWeek,
  getBallotWeek,
  getBallotWeeks,
  getBallotYears,
} from "@/actions/ballots";

type PollOption = {
  id: string;
  name: string;
  slug: string;
  sportId: string;
  sportSlug: string;
};

type WeekOption = { weekKey: string; label: string };

const label =
  "text-muted-foreground text-xs font-medium tracking-wide uppercase";

/** Consensus top-25 teams a ballot leaves off: the usual "you forgot …". */
export function leftOff(
  entries: BallotWeek["ballots"][number]["entries"],
  consensus: BallotWeek["consensus"],
) {
  const ranked = new Set(entries.map((entry) => entry.schoolId));
  return consensus.filter((team) => !ranked.has(team.schoolId));
}

/**
 * Read-only ballots for one poll and week: who's in, who's still out, and
 * each ballot as it stands. Opens on the newest week so viewers can catch
 * mistakes before rankings are published.
 */
export function BallotAudit({ polls }: { polls: PollOption[] }) {
  const [pollId, setPollId] = useState(polls[0]?.id ?? "");
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [weekKey, setWeekKey] = useState<string | null>(null);
  const [week, setWeek] = useState<BallotWeek | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const poll = useMemo(
    () => polls.find((option) => option.id === pollId) ?? null,
    [polls, pollId],
  );

  useEffect(() => {
    if (!poll) return;
    let cancelled = false;
    setWeek(null);
    getBallotYears(poll.sportId).then(
      (next) => {
        if (cancelled) return;
        setYears(next);
        setYear(next[0] ?? null);
      },
      (err: unknown) => !cancelled && setError(message(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [poll]);

  useEffect(() => {
    if (!poll || year == null) return;
    let cancelled = false;
    setWeek(null);
    getBallotWeeks({ sportId: poll.sportId, year }).then(
      (next) => {
        if (cancelled) return;
        setWeeks(next);
        setWeekKey(next[0]?.weekKey ?? null);
      },
      (err: unknown) => !cancelled && setError(message(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [poll, year]);

  useEffect(() => {
    if (!poll || year == null || !weekKey) return;
    let cancelled = false;
    setError(null);
    setWeek(null);
    getBallotWeek({
      sportSlug: poll.sportSlug,
      division: poll.slug,
      year,
      weekKey,
    }).then(
      (next) => !cancelled && setWeek(next),
      (err: unknown) => !cancelled && setError(message(err)),
    );
    return () => {
      cancelled = true;
    };
  }, [poll, year, weekKey]);

  const ballots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!week) return [];
    return q
      ? week.ballots.filter((ballot) => ballot.name.toLowerCase().includes(q))
      : week.ballots;
  }, [week, query]);

  if (polls.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No active polls right now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={label} id="ballots-poll">
            Poll
          </span>
          <Select value={pollId} onValueChange={whenSelected(setPollId)}>
            <SelectTrigger className="min-w-56" aria-labelledby="ballots-poll">
              <SelectValue placeholder="Select poll" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {polls.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label} id="ballots-year">
            Year
          </span>
          <Select
            value={year?.toString() ?? ""}
            onValueChange={whenSelected((value: string) =>
              setYear(Number(value)),
            )}
            disabled={!years.length}
          >
            <SelectTrigger className="min-w-28" aria-labelledby="ballots-year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label} id="ballots-week">
            Week
          </span>
          <Select
            value={weekKey ?? ""}
            onValueChange={setWeekKey}
            disabled={!weeks.length}
          >
            <SelectTrigger className="min-w-40" aria-labelledby="ballots-week">
              <SelectValue placeholder="Week" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {weeks.map((option) => (
                  <SelectItem key={option.weekKey} value={option.weekKey}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label className={label} htmlFor="ballots-search">
            Find a voter
          </label>
          <Input
            id="ballots-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name"
          />
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {week ? (
        <>
          <div
            className="flex flex-wrap items-center gap-2 text-sm"
            aria-live="polite"
          >
            <span className="font-medium">
              {week.ballotCount} of {week.assignedCount} ballots in
            </span>
            <Badge variant={week.published ? "secondary" : "outline"}>
              {week.published ? "Published" : "Not published yet"}
            </Badge>
          </div>

          {week.missing.length ? (
            <section
              aria-labelledby="ballots-missing"
              className="rounded-xl border p-4"
            >
              <h2 id="ballots-missing" className="font-medium">
                Still out ({week.missing.length})
              </h2>
              <ul className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {week.missing.map((voter) => (
                  <li key={voter.userId}>
                    {voter.name}
                    {voter.organization ? ` · ${voter.organization}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {ballots.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {week.ballots.length
                ? "No voter matches that name."
                : "No ballots in yet."}
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ballots.map((ballot) => {
                const missed = leftOff(ballot.entries, week.consensus);
                return (
                  <li key={ballot.userId} className="rounded-xl border p-4">
                    <h3 className="font-medium">{ballot.name}</h3>
                    {ballot.organization ? (
                      <p className="text-muted-foreground text-xs">
                        {ballot.organization}
                      </p>
                    ) : null}
                    <ol className="mt-3 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-sm">
                      {ballot.entries.map((entry) => (
                        <li key={entry.schoolId} className="contents">
                          <span className="text-muted-foreground text-right font-mono tabular-nums">
                            {entry.rank}
                          </span>
                          <span className="truncate">{entry.name}</span>
                        </li>
                      ))}
                    </ol>
                    {missed.length ? (
                      <p className="text-muted-foreground mt-3 border-t pt-2 text-xs">
                        <span className="text-foreground font-medium">
                          Leaves off consensus top 25:
                        </span>{" "}
                        {missed.map((team) => team.name).join(", ")}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : !error && weekKey ? (
        <p className="text-muted-foreground text-sm" aria-busy>
          Loading ballots…
        </p>
      ) : null}
    </div>
  );
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Couldn't load ballots";
}
