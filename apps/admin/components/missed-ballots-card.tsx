"use client";

import type { PollAttendance } from "@redshirt-sports/db/queries";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@redshirt-sports/ui/components/dialog";
import { Input } from "@redshirt-sports/ui/components/input";
import { Label } from "@redshirt-sports/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  excuseAhead,
  excuseMissedBallot,
  reinstateVoter,
  removeExcuseAhead,
} from "@/actions/attendance";

type Voter = PollAttendance["voters"][number];
type Miss = Voter["misses"][number];

type Selected = { voter: Voter; miss: Miss; pollName: string };

/**
 * Voters with a missed ballot this season, per poll. A week chip opens the
 * excuse dialog; a locked-out voter gets a Reinstate button; "Excuse ahead"
 * excuses a voter for a week that hasn't published yet.
 */
export function MissedBallotsCard({
  attendance,
}: {
  attendance: PollAttendance[];
}) {
  const router = useRouter();
  const [pending, startPending] = useTransition();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [note, setNote] = useState("");
  const [aheadPoll, setAheadPoll] = useState<PollAttendance | null>(null);
  const limit = attendance[0]?.limit ?? 3;

  function open(next: Selected) {
    setSelected(next);
    setNote(next.miss.excuseNote ?? "");
  }

  function saveExcuse(excused: boolean) {
    if (!selected) return;
    startPending(async () => {
      try {
        await excuseMissedBallot({ id: selected.miss.id, excused, note });
        toast.success(
          excused
            ? `Excused ${selected.miss.label} for ${selected.voter.firstName}`
            : `${selected.miss.label} counts again for ${selected.voter.firstName}`,
        );
        setSelected(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save excuse",
        );
      }
    });
  }

  function removeAhead() {
    if (!selected) return;
    startPending(async () => {
      try {
        await removeExcuseAhead({ id: selected.miss.id });
        toast.success(
          `Removed ${selected.voter.firstName}'s excuse for ${selected.miss.label}`,
        );
        setSelected(null);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to remove excuse",
        );
      }
    });
  }

  function reinstate(poll: PollAttendance, voter: Voter) {
    startPending(async () => {
      try {
        await reinstateVoter({ pollId: poll.pollId, userId: voter.userId });
        toast.success(
          `${voter.firstName} ${voter.lastName} is back on ${poll.pollName}`,
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to reinstate voter",
        );
      }
    });
  }

  return (
    <section
      aria-labelledby="missed-ballots-heading"
      className="overflow-hidden rounded-xl border"
    >
      <div className="border-b px-5 py-4">
        <h2
          id="missed-ballots-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Missed ballots
        </h2>
        <p className="text-muted-foreground text-sm">
          Recorded when a week publishes. {limit} unexcused misses in a season
          takes a voter off the panel; excuse a week if they told you ahead of
          time.
        </p>
      </div>

      {attendance.length === 0 ? (
        <div className="text-muted-foreground px-5 py-12 text-center text-sm">
          No active polls.
        </div>
      ) : (
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {attendance.map((poll) => (
            <PollMisses
              key={poll.pollId}
              poll={poll}
              pending={pending}
              onOpen={(voter, miss) =>
                open({ voter, miss, pollName: poll.pollName })
              }
              onReinstate={(voter) => reinstate(poll, voter)}
              onExcuseAhead={() => setAheadPoll(poll)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={selected != null}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected?.voter.firstName} {selected?.voter.lastName} ·{" "}
              {selected?.miss.label}
            </DialogTitle>
            <DialogDescription>
              {selected?.miss.upcoming
                ? "Excused ahead of time. If they vote anyway, this goes away when the week publishes."
                : selected?.miss.excused
                  ? "This miss is excused and doesn't count toward the lockout."
                  : `Excused misses don't count toward the ${limit}-miss lockout on ${selected?.pollName}. Excusing doesn't reinstate a locked-out voter.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="excuse-note">Note (optional)</Label>
            <Input
              id="excuse-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Emailed ahead: traveling"
            />
          </div>
          <DialogFooter>
            {selected?.miss.upcoming ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={removeAhead}
              >
                Remove excuse
              </Button>
            ) : selected?.miss.excused ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => saveExcuse(false)}
              >
                Count it again
              </Button>
            ) : null}
            <Button disabled={pending} onClick={() => saveExcuse(true)}>
              {selected?.miss.excused ? "Save note" : "Excuse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExcuseAheadDialog
        // Remount per poll so the form starts fresh each time it opens.
        key={aheadPoll?.pollId ?? "closed"}
        poll={aheadPoll}
        onClose={() => setAheadPoll(null)}
        onSaved={() => {
          setAheadPoll(null);
          router.refresh();
        }}
      />
    </section>
  );
}

/** Pick a voter and an unpublished week, before they miss it. */
function ExcuseAheadDialog({
  poll,
  onClose,
  onSaved,
}: {
  poll: PollAttendance | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startPending] = useTransition();
  const [userId, setUserId] = useState("");
  const [weekId, setWeekId] = useState(poll?.upcomingWeeks[0]?.id ?? "");
  const [note, setNote] = useState("");

  function save() {
    if (!poll) return;
    const voter = poll.assignedVoters.find((row) => row.userId === userId);
    const week = poll.upcomingWeeks.find((row) => row.id === weekId);
    startPending(async () => {
      try {
        await excuseAhead({ pollId: poll.pollId, userId, weekId, note });
        toast.success(
          `Excused ${voter?.firstName} ${voter?.lastName} for ${week?.label}`,
        );
        onSaved();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to excuse ahead",
        );
      }
    });
  }

  return (
    <Dialog
      open={poll != null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excuse ahead · {poll?.pollName}</DialogTitle>
          <DialogDescription>
            For a voter who told you they'll miss a week. It won't count toward
            the lockout when that week publishes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="excuse-ahead-voter">Voter</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="excuse-ahead-voter" className="w-full">
                <SelectValue placeholder="Choose a voter" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {poll?.assignedVoters.map((voter) => (
                    <SelectItem key={voter.userId} value={voter.userId}>
                      {voter.firstName} {voter.lastName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="excuse-ahead-week">Week</Label>
            <Select value={weekId} onValueChange={setWeekId}>
              <SelectTrigger id="excuse-ahead-week" className="w-full">
                <SelectValue placeholder="Choose a week" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {poll?.upcomingWeeks.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="excuse-ahead-note">Note (optional)</Label>
            <Input
              id="excuse-ahead-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Emailed Thursday: traveling"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending || !userId || !weekId} onClick={save}>
            Excuse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function missSummary(poll: PollAttendance) {
  const missed = poll.voters.filter((voter) =>
    voter.misses.some((miss) => !miss.upcoming),
  ).length;
  const ahead = poll.voters.reduce(
    (sum, voter) => sum + voter.misses.filter((miss) => miss.upcoming).length,
    0,
  );
  if (missed === 0 && ahead === 0) return "No missed ballots";
  const lockedOut = poll.voters.filter((voter) => voter.lockedOut).length;
  const atRisk = poll.voters.filter(
    (voter) => !voter.lockedOut && voter.unexcusedCount >= poll.limit - 1,
  ).length;
  return [
    missed > 0 ? `${missed} voter${missed === 1 ? "" : "s"} with misses` : null,
    atRisk > 0 ? `${atRisk} one miss from lockout` : null,
    lockedOut > 0 ? `${lockedOut} locked out` : null,
    ahead > 0 ? `${ahead} excused ahead` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** One poll's missed ballots, in its own panel so polls never blur together. */
function PollMisses({
  poll,
  pending,
  onOpen,
  onReinstate,
  onExcuseAhead,
}: {
  poll: PollAttendance;
  pending: boolean;
  onOpen: (voter: Voter, miss: Miss) => void;
  onReinstate: (voter: Voter) => void;
  onExcuseAhead: () => void;
}) {
  const headingId = `missed-${poll.pollId}`;
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col overflow-hidden rounded-lg border"
    >
      <div className="bg-muted/40 flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id={headingId} className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">
              {poll.pollName}
            </span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {poll.year}
            </span>
          </h3>
          <p className="text-muted-foreground text-xs">{missSummary(poll)}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={
            pending ||
            poll.upcomingWeeks.length === 0 ||
            poll.assignedVoters.length === 0
          }
          onClick={onExcuseAhead}
        >
          Excuse ahead
        </Button>
      </div>
      {poll.voters.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 text-center text-sm">
          Every assigned voter has a ballot in for each published week.
        </p>
      ) : (
        <ul className="divide-y">
          {poll.voters.map((voter) => (
            <li key={voter.userId} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">
                    {voter.firstName} {voter.lastName}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {voter.organization ?? "—"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {voter.lockedOut ? (
                    <>
                      <Badge variant="destructive">Locked out</Badge>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => onReinstate(voter)}
                      >
                        Reinstate
                      </Button>
                    </>
                  ) : (
                    <Badge
                      variant={
                        voter.unexcusedCount >= poll.limit - 1
                          ? "destructive"
                          : "outline"
                      }
                      className="font-mono tabular-nums"
                    >
                      {voter.unexcusedCount} / {poll.limit}
                    </Badge>
                  )}
                </div>
              </div>
              <ul
                className="flex flex-wrap gap-1.5"
                aria-label={`Missed ${poll.pollName} weeks for ${voter.firstName} ${voter.lastName}`}
              >
                {voter.misses.map((miss) => (
                  <li key={miss.id}>
                    <Button
                      size="sm"
                      variant={
                        miss.excused && !miss.upcoming ? "ghost" : "outline"
                      }
                      className={
                        miss.upcoming
                          ? "text-muted-foreground h-7 border-dashed"
                          : miss.excused
                            ? "text-muted-foreground h-7 line-through"
                            : "h-7"
                      }
                      title={
                        miss.upcoming
                          ? `Excused ahead${miss.excuseNote ? `: ${miss.excuseNote}` : ""}`
                          : miss.excused
                            ? `Excused${miss.excuseNote ? `: ${miss.excuseNote}` : ""}`
                            : "Excuse this week"
                      }
                      disabled={pending}
                      onClick={() => onOpen(voter, miss)}
                    >
                      {miss.label}
                      {miss.upcoming ? (
                        <span className="text-xs">(ahead)</span>
                      ) : null}
                    </Button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
