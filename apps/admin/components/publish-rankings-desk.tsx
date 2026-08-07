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
  Select,
  SelectContent,
  SelectGroup,
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
import {
  IconCopy,
  IconMail,
  IconRefresh,
  IconRocket,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  getVoterNudgeMailto,
  getWeeksForPollSportYear,
  getYearsForPollSport,
  previewRankingsPublish,
  publishRankings,
  reassignVoterBallotWeek,
} from "@/actions/publish-rankings";
import { buildNudgeMessage } from "@/lib/nudge";

type PollOption = {
  id: string;
  name: string;
  slug: string;
  sportId: string;
  sportSlug: string;
  sportName: string;
};

type WeekOption = {
  weekKey: string;
  legacyWeek: number;
  label: string;
  seasonType: number;
  weekNumber: number;
};

type Preview = Awaited<ReturnType<typeof previewRankingsPublish>>;

export function PublishRankingsDesk({ polls }: { polls: PollOption[] }) {
  const [pollId, setPollId] = useState(polls[0]?.id ?? "");
  const [year, setYear] = useState<number | null>(null);
  const [weekKey, setWeekKey] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reassignTargetByUser, setReassignTargetByUser] = useState<
    Record<string, string>
  >({});
  const [pending, startPending] = useTransition();

  const selectedPoll = useMemo(
    () => polls.find((poll) => poll.id === pollId) ?? null,
    [polls, pollId],
  );

  const selectedWeek = useMemo(
    () => weeks.find((option) => option.weekKey === weekKey) ?? null,
    [weeks, weekKey],
  );

  useEffect(() => {
    if (!selectedPoll) return;
    let cancelled = false;
    startPending(async () => {
      try {
        const nextYears = await getYearsForPollSport(selectedPoll.sportId);
        if (cancelled) return;
        setYears(nextYears);
        setYear(nextYears[0] ?? null);
        setWeekKey(null);
        setWeeks([]);
        setPreview(null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load years",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPoll]);

  useEffect(() => {
    if (!selectedPoll || year == null) return;
    let cancelled = false;
    startPending(async () => {
      try {
        const nextWeeks = await getWeeksForPollSportYear({
          sportId: selectedPoll.sportId,
          year,
        });
        if (cancelled) return;
        setWeeks(nextWeeks);
        setWeekKey(nextWeeks[0]?.weekKey ?? null);
        setPreview(null);
        setReassignTargetByUser({});
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load weeks",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPoll, year]);

  function loadPreview() {
    if (!selectedPoll || year == null || !weekKey) return;
    startPending(async () => {
      try {
        const next = await previewRankingsPublish({
          sportSlug: selectedPoll.sportSlug,
          division: selectedPoll.slug,
          year,
          weekKey,
        });
        setPreview(next);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load week",
        );
      }
    });
  }

  function runPublish() {
    if (!selectedPoll || year == null || !weekKey) return;
    startPending(async () => {
      try {
        const result = await publishRankings({
          sportSlug: selectedPoll.sportSlug,
          division: selectedPoll.slug,
          year,
          weekKey,
        });
        toast.success(
          `Published ${result.teams} teams from ${result.ballots} ballots`,
        );
        setConfirmOpen(false);
        const next = await previewRankingsPublish({
          sportSlug: selectedPoll.sportSlug,
          division: selectedPoll.slug,
          year,
          weekKey,
        });
        setPreview(next);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to publish",
        );
      }
    });
  }

  async function copyNudge(voter: Preview["missing"][number]) {
    if (!selectedPoll) return;
    const text = buildNudgeMessage({
      firstName: voter.firstName,
      pollName: selectedPoll.name,
      sportSlug: selectedPoll.sportSlug,
      division: selectedPoll.slug,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Nudge copied");
    } catch {
      toast.error("Could not copy nudge");
    }
  }

  function emailNudge(voter: Preview["missing"][number]) {
    if (!selectedPoll) return;
    startPending(async () => {
      try {
        const { mailto } = await getVoterNudgeMailto({
          userId: voter.userId,
          firstName: voter.firstName,
          pollName: selectedPoll.name,
          sportSlug: selectedPoll.sportSlug,
          division: selectedPoll.slug,
        });
        window.location.href = mailto;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not open email",
        );
      }
    });
  }

  function reassignBallot(voter: Preview["panel"][number]) {
    if (!selectedPoll || year == null || !weekKey) return;
    const toWeekKey = reassignTargetByUser[voter.userId];
    if (!toWeekKey) {
      toast.error("Choose a target week first");
      return;
    }
    startPending(async () => {
      try {
        await reassignVoterBallotWeek({
          pollId: selectedPoll.id,
          sportId: selectedPoll.sportId,
          year,
          userId: voter.userId,
          fromWeekKey: weekKey,
          toWeekKey,
        });
        toast.success(`Moved ballot for ${voter.firstName} ${voter.lastName}`);
        const next = await previewRankingsPublish({
          sportSlug: selectedPoll.sportSlug,
          division: selectedPoll.slug,
          year,
          weekKey,
        });
        setPreview(next);
        setReassignTargetByUser((prev) => {
          const { [voter.userId]: _, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to move ballot",
        );
      }
    });
  }

  const otherWeeks = weeks.filter((option) => option.weekKey !== weekKey);

  const top25 = preview?.rankings.filter(
    (row) => row.rank != null && row.rank <= 25,
  );
  const orvCount = (preview?.rankings.length ?? 0) - (top25?.length ?? 0);

  if (polls.length === 0) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        No active polls yet. Create one under Polls first.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Panel
          </span>
          <Select
            value={pollId}
            onValueChange={(value) => {
              setPollId(value);
              setPreview(null);
            }}
          >
            <SelectTrigger className="min-w-56">
              <SelectValue placeholder="Select poll" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {polls.map((poll) => (
                  <SelectItem key={poll.id} value={poll.id}>
                    {poll.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Year
          </span>
          <Select
            value={year?.toString() ?? ""}
            onValueChange={(value) => setYear(Number(value))}
            disabled={!years.length}
          >
            <SelectTrigger className="min-w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Week
          </span>
          <Select
            value={weekKey ?? ""}
            onValueChange={setWeekKey}
            disabled={!weeks.length}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Week" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {weeks.map((w) => (
                  <SelectItem key={w.weekKey} value={w.weekKey}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={loadPreview}
          disabled={pending || !selectedPoll || year == null || !weekKey}
        >
          <IconRefresh data-icon="inline-start" />
          Load week
        </Button>
      </div>

      {preview ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {preview.ballotCount}/{preview.assignedCount} ballots in
            </Badge>
            <Badge variant={preview.missingCount > 0 ? "secondary" : "outline"}>
              {preview.missingCount} missing
            </Badge>
            {preview.alreadyPublished ? (
              <Badge variant="secondary">
                Already published ({preview.existingRankingRows} rows)
              </Badge>
            ) : (
              <Badge variant="outline">Not published yet</Badge>
            )}
            {pending ? <Badge variant="secondary">Working…</Badge> : null}
          </div>

          <section className="overflow-hidden rounded-xl border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Ballot inbox
                </h2>
                <p className="text-muted-foreground text-sm">
                  Who still needs to submit before Monday 8:00 AM MST
                </p>
              </div>
            </div>
            {preview.panel.length === 0 ? (
              <p className="text-muted-foreground px-5 py-8 text-sm">
                No voters assigned to this panel.
              </p>
            ) : (
              <ul className="divide-y">
                {preview.panel.map((voter) => (
                  <li
                    key={voter.userId}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {voter.firstName} {voter.lastName}
                      </span>
                      <span className="text-muted-foreground truncate text-sm">
                        {voter.organization ?? "No organization"}
                      </span>
                    </div>
                    {voter.submitted ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Submitted</Badge>
                        {otherWeeks.length > 0 ? (
                          <>
                            <Select
                              value={reassignTargetByUser[voter.userId] ?? ""}
                              onValueChange={(value) =>
                                setReassignTargetByUser((prev) => ({
                                  ...prev,
                                  [voter.userId]: value,
                                }))
                              }
                            >
                              <SelectTrigger className="min-w-36" size="sm">
                                <SelectValue placeholder="Move to…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {otherWeeks.map((w) => (
                                    <SelectItem
                                      key={w.weekKey}
                                      value={w.weekKey}
                                    >
                                      {w.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reassignBallot(voter)}
                              disabled={
                                pending || !reassignTargetByUser[voter.userId]
                              }
                            >
                              Move ballot
                            </Button>
                          </>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Missing</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyNudge(voter)}
                          disabled={pending}
                        >
                          <IconCopy data-icon="inline-start" />
                          Copy nudge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => emailNudge(voter)}
                          disabled={pending}
                        >
                          <IconMail data-icon="inline-start" />
                          Email
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Ranking preview
                </h2>
                <p className="text-muted-foreground text-sm">
                  {top25?.length ?? 0} in Top 25
                  {orvCount > 0 ? ` · ${orvCount} receiving votes` : ""}
                </p>
              </div>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={pending || preview.ballotCount === 0}
              >
                <IconRocket data-icon="inline-start" />
                {preview.alreadyPublished ? "Re-publish" : "Publish rankings"}
              </Button>
            </div>
            {preview.ballotCount === 0 ? (
              <p className="text-muted-foreground px-5 py-8 text-sm">
                No ballots for this week yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>1st</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(top25 ?? []).map((row) => (
                    <TableRow key={row.schoolId}>
                      <TableCell>
                        {row.isTie ? `T-${row.rank}` : row.rank}
                      </TableCell>
                      <TableCell>
                        {row.shortName ?? row.abbreviation ?? row.name}
                      </TableCell>
                      <TableCell>{row.points}</TableCell>
                      <TableCell>{row.firstPlaceVotes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      ) : (
        <div className="text-muted-foreground rounded-xl border border-dashed px-5 py-12 text-center text-sm">
          Choose a panel, year, and week, then load the week.
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {preview?.alreadyPublished
                ? "Re-publish rankings?"
                : "Publish rankings?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {preview
                ? [
                    `This writes the Top 25 for ${selectedPoll?.name} · ${year} · ${selectedWeek?.label ?? "selected week"} from ${preview.ballotCount} ballot${preview.ballotCount === 1 ? "" : "s"}.`,
                    preview.missingCount > 0
                      ? `${preview.missingCount} assigned voter${preview.missingCount === 1 ? " is" : "s are"} still missing.`
                      : null,
                    preview.alreadyPublished
                      ? "Existing rankings for this week will be replaced."
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runPublish} disabled={pending}>
              {preview?.alreadyPublished ? "Re-publish" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
