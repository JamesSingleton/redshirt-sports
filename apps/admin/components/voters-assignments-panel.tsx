"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  listSportsAction,
  listVotersAction,
  setAssignmentsAction,
} from "@/actions/voters";

const DIVISIONS = [
  "fbs",
  "fcs",
  "d2",
  "d3",
  "mid-major",
  "power-conferences",
] as const;

type Sport = Awaited<ReturnType<typeof listSportsAction>>[number];
type Voter = Awaited<ReturnType<typeof listVotersAction>>[number];

function assignmentKey(sportId: string, division: string) {
  return `${sportId}::${division}`;
}

function voterDisplayName(voter: Voter) {
  return `${voter.firstName} ${voter.lastName}`.trim();
}

export function VotersAssignmentsPanel() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Set<string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pollColumns = useMemo(
    () =>
      sports.flatMap((sport) =>
        DIVISIONS.map((division) => ({
          sportId: sport.id,
          sportLabel: sport.displayName || sport.name,
          division,
          key: assignmentKey(sport.id, division),
        })),
      ),
    [sports],
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const [sportsResult, votersResult] = await Promise.all([
          listSportsAction(),
          listVotersAction(),
        ]);
        setSports(sportsResult);
        setVoters(votersResult);

        const nextDrafts: Record<string, Set<string>> = {};
        for (const voter of votersResult) {
          nextDrafts[voter.id] = new Set(
            voter.voterPollAssignments.map(
              (a: { sportId: string; division: string }) =>
                assignmentKey(a.sportId, a.division),
            ),
          );
        }
        setDrafts(nextDrafts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load voters");
      }
    });
  }, []);

  function toggleAssignment(userId: string, key: string) {
    setDrafts((prev) => {
      const current = new Set(prev[userId] ?? []);
      if (current.has(key)) {
        current.delete(key);
      } else {
        current.add(key);
      }
      return { ...prev, [userId]: current };
    });
    setMessage(null);
  }

  function saveVoter(userId: string) {
    const selected = drafts[userId] ?? new Set();
    const assignments = [...selected].map((key) => {
      const [sportId, division] = key.split("::");
      return { sportId: sportId!, division: division! };
    });

    setError(null);
    setMessage(null);
    setSavingUserId(userId);
    startTransition(async () => {
      try {
        await setAssignmentsAction(userId, assignments);
        setMessage(`Saved assignments for voter.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSavingUserId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold">Voter poll assignments</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Assign voters to sport × division polls. Save per voter after editing.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm px-1">{error}</p> : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400 px-1">
          {message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Voters</CardTitle>
          <CardDescription>
            {isPending && voters.length === 0
              ? "Loading…"
              : `${voters.length} voter${voters.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {voters.length === 0 && !isPending ? (
            <p className="text-muted-foreground text-sm">
              No voters found. Mark users as voters first.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-background min-w-[180px]">
                    Voter
                  </TableHead>
                  {pollColumns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="whitespace-nowrap text-center text-xs"
                    >
                      <div>{col.sportLabel}</div>
                      <div className="font-normal text-muted-foreground">
                        {col.division}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="sticky right-0 z-10 bg-background">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voters.map((voter) => {
                  const selected = drafts[voter.id] ?? new Set();
                  return (
                    <TableRow key={voter.id}>
                      <TableCell className="sticky left-0 z-10 bg-background">
                        <div className="font-medium">
                          {voterDisplayName(voter)}
                        </div>
                        {voter.organization ? (
                          <div className="text-muted-foreground text-xs">
                            {voter.organization}
                          </div>
                        ) : null}
                      </TableCell>
                      {pollColumns.map((col) => (
                        <TableCell key={col.key} className="text-center">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selected.has(col.key)}
                            onChange={() => toggleAssignment(voter.id, col.key)}
                            aria-label={`${voterDisplayName(voter)} ${col.sportLabel} ${col.division}`}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 z-10 bg-background">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending && savingUserId === voter.id}
                          onClick={() => saveVoter(voter.id)}
                        >
                          {savingUserId === voter.id ? "Saving…" : "Save"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
