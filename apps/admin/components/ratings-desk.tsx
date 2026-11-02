"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@redshirt-sports/ui/components/alert-dialog";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { Checkbox } from "@redshirt-sports/ui/components/checkbox";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@redshirt-sports/ui/components/sheet";
import { Switch } from "@redshirt-sports/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@redshirt-sports/ui/components/tabs";
import { IconPlayerPlay, IconRefresh, IconRocket } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  computeRatings,
  findSchools,
  findUnmappedTeams,
  mapTeamToSchool,
  previewRatingsRun,
  publishRatingsRun,
  type RatingsActionResult,
  type RatingsBootstrap,
  type RatingsPoolState,
  runPipelineNow,
  setRatingsPoolFlags,
  syncRatings,
  unpublishRatingsWeek,
} from "@/actions/ratings";

type Diff = Awaited<ReturnType<typeof previewRatingsRun>>;
type Unmapped = Awaited<ReturnType<typeof findUnmappedTeams>>;

function formatTime(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}

function movement(now: number | null, before: number | null) {
  if (now == null || before == null || now === before) return null;
  const delta = before - now;
  return (
    <span className={delta > 0 ? "text-emerald-600" : "text-red-600"}>
      {delta > 0 ? `▲${delta}` : `▼${-delta}`}
    </span>
  );
}

function statusBadge(status: string) {
  const variant =
    status === "published" || status === "succeeded"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function JobOutput({ result }: { result: RatingsActionResult | null }) {
  if (!result || result.lines.length === 0) return null;
  return (
    <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap">
      {result.lines.join("\n")}
    </pre>
  );
}

function PoolPanel({ pool }: { pool: RatingsPoolState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [last, setLast] = useState<RatingsActionResult | null>(null);
  const [year, setYear] = useState(
    String(pool.overview.year ?? new Date().getFullYear()),
  );
  const [weekId, setWeekId] = useState<string>(pool.overview.week?.id ?? "all");
  const [force, setForce] = useState(false);
  const [ignoreCompleteness, setIgnoreCompleteness] = useState(false);
  const [diff, setDiff] = useState<{ runId: string; data: Diff } | null>(null);
  const [confirmRun, setConfirmRun] = useState<
    RatingsPoolState["runs"][number] | null
  >(null);
  const [unmapped, setUnmapped] = useState<Unmapped | null>(null);
  const [search, setSearch] = useState<Record<string, string>>({});
  const [results, setResults] = useState<
    Record<
      string,
      Array<{ id: string; name: string | null; shortName: string | null }>
    >
  >({});

  const run = (label: string, work: () => Promise<RatingsActionResult>) =>
    startTransition(async () => {
      const result = await work();
      setLast(result);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message || `${label} failed`);
      router.refresh();
    });

  const status = pool.overview.status;
  const weekChoice = weekId === "all" ? "all" : weekId;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {pool.name} {pool.sportSlug}
            <Badge variant={pool.isActive ? "default" : "secondary"}>
              {pool.isActive ? "cron on" : "cron off"}
            </Badge>
            <Badge variant={pool.isPublic ? "default" : "outline"}>
              {pool.isPublic ? "public" : "not public"}
            </Badge>
            <Badge variant="outline">method v{pool.methodVersion}</Badge>
          </CardTitle>
          <CardDescription>
            The cron syncs from ESPN every 30 minutes during the pool's windows
            and publishes once every game that has kicked off this week is final
            and nothing else starts within 24 hours. Unchanged inputs never
            republish.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 border-b pb-4">
          <div className="flex items-center gap-2">
            <Switch
              id={`${pool.id}-active`}
              checked={pool.isActive}
              disabled={pending}
              onCheckedChange={(checked) =>
                run("Cron", () =>
                  setRatingsPoolFlags({ poolId: pool.id, isActive: checked }),
                )
              }
            />
            <Label htmlFor={`${pool.id}-active`}>
              Cron syncs and publishes this pool
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`${pool.id}-public`}
              checked={pool.isPublic}
              disabled={pending}
              onCheckedChange={(checked) =>
                run("Public", () =>
                  setRatingsPoolFlags({ poolId: pool.id, isPublic: checked }),
                )
              }
            />
            <Label htmlFor={`${pool.id}-public`}>
              Ratings pages are public
            </Label>
          </div>
        </CardContent>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase">
              Current week
            </p>
            <p className="text-lg font-semibold">
              {pool.overview.year ?? "—"} {pool.overview.week?.label ?? ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">
              Games final
            </p>
            <p className="text-lg font-semibold">
              {status ? `${status.final} / ${status.total}` : "—"}
            </p>
            {status && status.inProgress > 0 ? (
              <p className="text-xs">{status.inProgress} live</p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">
              Weekend complete
            </p>
            <p className="text-lg font-semibold">
              {status ? (status.complete ? "Yes" : "Not yet") : "—"}
            </p>
            {status?.nextKickoff ? (
              <p className="text-xs">
                Next kickoff{" "}
                {formatTime(new Date(status.nextKickoff).toISOString())}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Members</p>
            <p className="text-lg font-semibold">{pool.overview.members}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run jobs</CardTitle>
          <CardDescription>
            Run now does exactly what the cron does. Sync and compute never
            change the public site; only Publish does.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={pending}
              onClick={() =>
                run("Run now", () =>
                  runPipelineNow({ poolId: pool.id, ignoreCompleteness }),
                )
              }
            >
              <IconPlayerPlay /> Run now
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${pool.id}-ignore`}
                checked={ignoreCompleteness}
                onCheckedChange={(v) => setIgnoreCompleteness(v === true)}
              />
              <Label htmlFor={`${pool.id}-ignore`}>
                Publish even if games are still scheduled
              </Label>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <Label htmlFor={`${pool.id}-year`}>Season</Label>
              <Input
                id={`${pool.id}-year`}
                className="w-24"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Week</Label>
              <Select value={weekChoice} onValueChange={setWeekId}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Whole season</SelectItem>
                  {String(pool.overview.year) === year
                    ? pool.overview.weeks.map((week) => (
                        <SelectItem key={week.id} value={week.id}>
                          {week.label}
                        </SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                run("Sync", () =>
                  syncRatings({
                    poolId: pool.id,
                    year: Number(year),
                    weekId: weekChoice,
                  }),
                )
              }
            >
              <IconRefresh /> Sync games
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                run("Compute", () =>
                  computeRatings({
                    poolId: pool.id,
                    year: Number(year),
                    weekId: weekChoice,
                    force,
                  }),
                )
              }
            >
              Compute drafts
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${pool.id}-force`}
                checked={force}
                onCheckedChange={(v) => setForce(v === true)}
              />
              <Label htmlFor={`${pool.id}-force`}>
                Recompute even if unchanged
              </Label>
            </div>
          </div>
          {pending ? (
            <p className="text-muted-foreground text-sm">
              Working… a season takes a few seconds.
            </p>
          ) : null}
          <JobOutput result={last} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Runs</CardTitle>
          <CardDescription>
            Every computation is kept. Publish a draft, or publish an older run
            to roll back. Preview shows rank movement against what is public
            now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Games</TableHead>
                <TableHead>Computed</TableHead>
                <TableHead>Checksum</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pool.runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No runs yet. Sync, then compute.
                  </TableCell>
                </TableRow>
              ) : (
                pool.runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.year} {r.weekLabel}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      {statusBadge(r.status)}
                      {r.blockers > 0 ? (
                        <Badge variant="destructive">
                          {r.blockers} unmapped
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{r.trigger}</TableCell>
                    <TableCell>{r.gameCount}</TableCell>
                    <TableCell>{formatTime(r.computedAt)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.checksum.slice(0, 10)}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          startTransition(async () => {
                            setDiff({
                              runId: r.id,
                              data: await previewRatingsRun(r.id),
                            });
                          })
                        }
                      >
                        Preview
                      </Button>
                      {r.status === "published" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            run("Unpublish", () =>
                              unpublishRatingsWeek({
                                poolId: pool.id,
                                weekId: r.weekId,
                              }),
                            )
                          }
                        >
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => setConfirmRun(r)}
                        >
                          <IconRocket /> Publish
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team mapping</CardTitle>
          <CardDescription>
            Pool members at ESPN that have no Redshirt school. A member that has
            played games blocks publishing until it is mapped. ESPN uses one
            team id across every sport.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-fit"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setUnmapped(
                  await findUnmappedTeams({
                    poolId: pool.id,
                    year: Number(year),
                  }),
                );
              })
            }
          >
            Check {year} members
          </Button>
          {unmapped && unmapped.length === 0 ? (
            <p className="text-sm">Every {year} member is mapped.</p>
          ) : null}
          {unmapped?.map((team) => (
            <div
              key={team.externalId}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <p className="font-medium">
                {team.displayName}{" "}
                <span className="text-muted-foreground text-xs">
                  ESPN {team.externalId}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {team.suggestions.map((school) => (
                  <Button
                    key={school.id}
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run("Map", () =>
                        mapTeamToSchool({
                          externalId: team.externalId,
                          schoolId: school.id,
                        }),
                      )
                    }
                  >
                    {school.name} ({Math.round(school.score * 100)}%)
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search schools"
                  className="w-64"
                  value={search[team.externalId] ?? ""}
                  onChange={(e) =>
                    setSearch((s) => ({
                      ...s,
                      [team.externalId]: e.target.value,
                    }))
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      const found = await findSchools(
                        search[team.externalId] ?? "",
                      );
                      setResults((r) => ({ ...r, [team.externalId]: found }));
                    })
                  }
                >
                  Search
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(results[team.externalId] ?? []).map((school) => (
                  <Button
                    key={school.id}
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      run("Map", () =>
                        mapTeamToSchool({
                          externalId: team.externalId,
                          schoolId: school.id,
                        }),
                      )
                    }
                  >
                    {school.shortName ?? school.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job log</CardTitle>
          <CardDescription>
            Every sync, compute, publish, and cron run, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {pool.jobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No jobs yet.</p>
          ) : null}
          {pool.jobs.map((job) => (
            <details key={job.id} className="rounded-md border p-2 text-sm">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                {statusBadge(job.status)}{" "}
                <span className="font-medium">{job.kind}</span>
                <span className="text-muted-foreground">
                  {job.trigger} · {formatTime(job.startedAt)}
                </span>
                {job.error ? (
                  <span className="text-red-600">{job.error}</span>
                ) : null}
              </summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap">
                {job.lines.join("\n") || "No output."}
              </pre>
            </details>
          ))}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmRun != null}
        onOpenChange={(open) => !open && setConfirmRun(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Publish {confirmRun?.year} {confirmRun?.weekLabel}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This replaces what the public site shows for that week. The
              current run stays in history, so you can publish it again to roll
              back.
              {confirmRun && confirmRun.blockers > 0
                ? ` ${confirmRun.blockers} unmapped member(s) played games; their results are missing from this run.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = confirmRun;
                setConfirmRun(null);
                if (target) {
                  run("Publish", () =>
                    publishRatingsRun({
                      poolId: pool.id,
                      runId: target.id,
                      allowBlockers: target.blockers > 0,
                    }),
                  );
                }
              }}
            >
              {confirmRun && confirmRun.blockers > 0
                ? "Publish anyway"
                : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={diff != null}
        onOpenChange={(open) => !open && setDiff(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Run preview</SheetTitle>
            <SheetDescription>
              All {diff?.data.rows.length ?? 0} teams by strength of record
              {diff?.data.against
                ? ", with movement against the published run"
                : ""}
              . Unranked teams (too few games) are last.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SOR</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Power</TableHead>
                  <TableHead>SOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diff?.data.rows.map((row) => (
                  <TableRow key={row.schoolId}>
                    <TableCell>
                      {row.sorRank ?? "—"}{" "}
                      {movement(row.sorRank, row.previousSorRank)}
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      {row.powerRank}{" "}
                      {movement(row.powerRank, row.previousPowerRank)}
                    </TableCell>
                    <TableCell>
                      {row.sosRank ?? "—"}{" "}
                      {movement(row.sosRank, row.previousSosRank)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function RatingsDesk({ pools }: { pools: RatingsBootstrap }) {
  if (pools.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No rating pools exist yet.
      </p>
    );
  }
  return (
    <Tabs defaultValue={pools[0]?.id}>
      <TabsList>
        {pools.map((pool) => (
          <TabsTrigger key={pool.id} value={pool.id}>
            {pool.name}{" "}
            {pool.sportSlug === "football"
              ? "football"
              : pool.sportSlug.replace("-", " ")}
          </TabsTrigger>
        ))}
      </TabsList>
      {pools.map((pool) => (
        <TabsContent key={pool.id} value={pool.id} className="mt-4">
          <PoolPanel pool={pool} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
