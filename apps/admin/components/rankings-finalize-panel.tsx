"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import { useState, useTransition } from "react";

import {
  finalizeRankings,
  getBallotStatusAction,
  previewFinalizeRankings,
  type RankingsActionParams,
} from "@/actions/rankings";

type SportParam = "football" | "mens-basketball" | "womens-basketball";

const SPORTS: { value: SportParam; label: string }[] = [
  { value: "football", label: "Football" },
  { value: "mens-basketball", label: "Men's Basketball" },
  { value: "womens-basketball", label: "Women's Basketball" },
];

const DIVISIONS = [
  { value: "fbs", label: "FBS" },
  { value: "fcs", label: "FCS" },
  { value: "d2", label: "D2" },
  { value: "d3", label: "D3" },
  { value: "mid-major", label: "Mid-Major" },
  { value: "power-conferences", label: "Power Conferences" },
] as const;

type BallotStatus = Awaited<ReturnType<typeof getBallotStatusAction>>;
type PreviewResult = Awaited<ReturnType<typeof previewFinalizeRankings>>;

function voterName(voter: { firstName: string; lastName: string }) {
  return `${voter.firstName} ${voter.lastName}`.trim();
}

export function RankingsFinalizePanel() {
  const currentYear = new Date().getFullYear();
  const [sportSlug, setSportSlug] = useState<SportParam>("football");
  const [division, setDivision] = useState<string>("fbs");
  const [year, setYear] = useState(currentYear);
  const [week, setWeek] = useState(0);
  const [ballotStatus, setBallotStatus] = useState<BallotStatus | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function params(): RankingsActionParams {
    return { sportSlug, division, year, week };
  }

  function loadStatus() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const status = await getBallotStatusAction(params());
        setBallotStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load status");
      }
    });
  }

  function runPreview() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const [status, result] = await Promise.all([
          getBallotStatusAction(params()),
          previewFinalizeRankings(params()),
        ]);
        setBallotStatus(status);
        setPreview(result);
        setMessage(
          result.rankings.length
            ? `Preview ready (${result.ballotCount} ballots, top ${Math.min(25, result.rankings.length)} shown).`
            : "No ballots found for this week.",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      }
    });
  }

  function runFinalize() {
    const confirmed = window.confirm(
      `Finalize Top 25 for ${sportSlug} / ${division} / ${year} week ${week}? This writes rankings to the database.`,
    );
    if (!confirmed) return;

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await finalizeRankings(params());
        setPreview(result);
        setMessage(
          result.written
            ? `Finalized. ${result.revalidationNote}`
            : "Finalize completed but nothing was written (no ballots).",
        );
        const status = await getBallotStatusAction(params());
        setBallotStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Finalize failed");
      }
    });
  }

  const top25 = preview?.rankings.slice(0, 25) ?? [];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-2xl font-bold">Rankings Finalization</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Preview and finalize weekly Top 25 polls from submitted ballots.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Poll selection</CardTitle>
          <CardDescription>
            Choose sport, division, year, and week, then load ballot status or
            preview rankings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sport">Sport</Label>
              <Select
                value={sportSlug}
                onValueChange={(value) => {
                  if (value) setSportSlug(value as SportParam);
                }}
              >
                <SelectTrigger id="sport" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="division">Division</Label>
              <Select
                value={division}
                onValueChange={(value) => {
                  if (value) setDivision(value);
                }}
              >
                <SelectTrigger id="division" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="week">Week</Label>
              <Input
                id="week"
                type="number"
                value={week}
                onChange={(e) => setWeek(Number(e.target.value))}
                min={0}
              />
              <p className="text-muted-foreground text-xs">
                Use 0 for preseason, 999 for final rankings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={loadStatus}
            >
              Load ballot status
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={runPreview}
            >
              Preview Top 25
            </Button>
            <Button type="button" disabled={isPending} onClick={runFinalize}>
              Finalize
            </Button>
          </div>

          {isPending ? (
            <p className="text-muted-foreground text-sm">Working…</p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {message ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              {message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {ballotStatus ? (
        <Card>
          <CardHeader>
            <CardTitle>Ballot status</CardTitle>
            <CardDescription>
              {ballotStatus.submitted.length} submitted ·{" "}
              {ballotStatus.missing.length} missing ·{" "}
              {ballotStatus.submitted.length + ballotStatus.missing.length}{" "}
              assigned
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">Submitted</h3>
              {ballotStatus.submitted.length === 0 ? (
                <p className="text-muted-foreground text-sm">None yet.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {ballotStatus.submitted.map((voter) => (
                    <li key={voter.id}>{voterName(voter)}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Missing</h3>
              {ballotStatus.missing.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  All assigned voters have submitted.
                </p>
              ) : (
                <ul className="text-sm space-y-1">
                  {ballotStatus.missing.map((voter) => (
                    <li key={voter.id}>{voterName(voter)}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {top25.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Top 25 preview</CardTitle>
            <CardDescription>
              {preview?.written
                ? "Written rankings"
                : "Dry-run preview (not written)"}{" "}
              · {preview?.ballotCount ?? 0} ballots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">1st</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top25.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>
                      {row.rank}
                      {row.isTie ? "*" : ""}
                    </TableCell>
                    <TableCell>
                      {row.name ?? row.shortName ?? row.abbreviation ?? row._id}
                    </TableCell>
                    <TableCell className="text-right">{row._points}</TableCell>
                    <TableCell className="text-right">
                      {row.firstPlaceVotes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
