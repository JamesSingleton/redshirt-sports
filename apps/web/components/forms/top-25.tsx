"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { analytics } from "@redshirt-sports/analytics";
import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@redshirt-sports/ui/components/alert-dialog";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@redshirt-sports/ui/components/form";
import {
  Meter,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@redshirt-sports/ui/components/meter";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@redshirt-sports/ui/components/segmented-control";
import {
  type ReorderMessage,
  reorderMessage,
  SortableList,
  SortableListDown,
  SortableListHandle,
  SortableListItem,
  SortableListUp,
} from "@redshirt-sports/ui/components/sortable-list";
import { toast } from "@redshirt-sports/ui/components/toast";
import { cn } from "@redshirt-sports/ui/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  GripVertical,
  Info,
  Loader2,
  XIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  conferenceOf,
  EligibleTeams,
} from "@/components/ballot/eligible-teams";
import CustomImage from "@/components/sanity-image";
import { type Ballot, clearSlot, placeTeam } from "@/lib/ballot-order";
import type { VoterBallotWithSchool } from "@/types/votes";
import { VirtualizedCombobox } from "../virtualized-combobox";

function rankString(rank: number) {
  const message = `Please select a team for rank ${rank}.`;
  return z
    .string({
      error: (issue) => (issue.input === undefined ? message : undefined),
    })
    .min(1, message);
}

export const formSchema = z
  .object({
    division: z
      .enum(["fbs", "fcs", "d2", "d3", "mid-major", "power-conferences"])
      .optional(),
    sport: z.string().optional(),
    rank_1: rankString(1),
    rank_2: rankString(2),
    rank_3: rankString(3),
    rank_4: rankString(4),
    rank_5: rankString(5),
    rank_6: rankString(6),
    rank_7: rankString(7),
    rank_8: rankString(8),
    rank_9: rankString(9),
    rank_10: rankString(10),
    rank_11: rankString(11),
    rank_12: rankString(12),
    rank_13: rankString(13),
    rank_14: rankString(14),
    rank_15: rankString(15),
    rank_16: rankString(16),
    rank_17: rankString(17),
    rank_18: rankString(18),
    rank_19: rankString(19),
    rank_20: rankString(20),
    rank_21: rankString(21),
    rank_22: rankString(22),
    rank_23: rankString(23),
    rank_24: rankString(24),
    rank_25: rankString(25),
  })
  .superRefine((arg, ctx) => {
    // find which arg items are duplicates
    const duplicates: string[] = Object.entries(arg).reduce(
      (acc: string[], [key, value]) => {
        if (value && Object.values(arg).filter((v) => v === value).length > 1) {
          acc.push(key);
        }
        return acc;
      },
      [],
    );

    if (duplicates.length) {
      duplicates.forEach((key) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate team selected for rank ${key.split("_")[1]}`,
          path: [`rank_${key.split("_")[1]}`],
        });
      });
    }
  });

type Top25Values = z.infer<typeof formSchema>;
type RankField = `rank_${number}` & keyof Top25Values;

const RANKS = Array.from({ length: 25 }, (_, i) => i + 1);
const EMPTY = "empty:";
const EMPTY_BALLOT = RANKS.map(() => "");

type Top25FormProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  previousBallot?: VoterBallotWithSchool[];
  currentBallot?: Array<{ teamId: string; rank: number }>;
  submit: {
    button: string;
    loading: string;
    method: "PATCH" | "POST";
    success: string;
    error: string;
    confirmTitle: string;
    confirm: string;
  };
};

function Top25Form({
  schools,
  previousBallot,
  currentBallot,
  submit,
}: Top25FormProps) {
  const defaultValues = useMemo(() => {
    if (!currentBallot?.length) return undefined;
    return Object.fromEntries(
      currentBallot.map((entry) => [`rank_${entry.rank}`, entry.teamId]),
    ) as Partial<z.infer<typeof formSchema>>;
  }, [currentBallot]);

  const form = useForm<Top25Values>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const formValues = form.watch();
  const ballot = RANKS.map(
    (rank) => formValues[`rank_${rank}` as RankField] ?? "",
  );
  const rankedCount = ballot.filter(Boolean).length;
  // Empty slots get keys too, so a team can move past them.
  const keys = ballot.map((team, index) => team || `${EMPTY}${index}`);
  const schoolsById = useMemo(
    () => new Map(schools.map((school) => [school._id, school])),
    [schools],
  );
  const nameOf = (team: string) => {
    const school = schoolsById.get(team);
    return school ? (school.shortName ?? school.name) : team;
  };
  const lastWeek = useMemo(
    () =>
      new Map((previousBallot ?? []).map((pick) => [pick.teamId, pick.rank])),
    [previousBallot],
  );
  const hasPreviousBallot = lastWeek.size > 0;

  const [view, setView] = useState<"ballot" | "teams">("ballot");
  const [confirming, setConfirming] = useState(false);
  // Missing-team errors wait for a submit attempt, so clearing or building
  // a ballot doesn't light up every empty rank.
  const [attempted, setAttempted] = useState(false);
  const spotsLeft = 25 - rankedCount;

  const params = useParams();
  const { sport, division } = params as {
    sport: string;
    division?: "fbs" | "fcs" | "d2" | "d3" | "mid-major" | "power-conferences";
  };
  const router = useRouter();

  // Fire `ballot_started` once, on the voter's first manual edit, not when
  // the previous ballot is filled in.
  const ballotStartedRef = useRef(false);
  function startBallot() {
    if (ballotStartedRef.current) return;
    ballotStartedRef.current = true;
    analytics?.capture("ballot_started", { sport, division });
  }

  // A pick or a removal can remount its row, so focus that rank's picker
  // once the new rows are in.
  const focusRank = useRef<number | null>(null);
  useEffect(() => {
    if (focusRank.current === null) return;
    document.getElementById(pickerId(focusRank.current))?.focus();
    focusRank.current = null;
  });

  /** Writes a whole ballot back to the rank fields that changed. */
  function setBallot(next: Ballot) {
    next.forEach((team, index) => {
      const name = `rank_${index + 1}` as RankField;
      if ((form.getValues(name) ?? "") === team) return;
      form.setValue(name, team, {
        shouldValidate: attempted,
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  }

  /** Replaces the ballot and offers to put the old one back. */
  function replaceBallot(next: Ballot, message: string) {
    const before = ballot;
    setBallot(next);
    toast(message, {
      action: { label: "Undo", onAction: () => setBallot(before) },
    });
  }

  function pick(index: number, team: string) {
    startBallot();
    focusRank.current = index + 1;
    if (!team) {
      setBallot(clearSlot(ballot, index));
      return;
    }
    const { ballot: next, dropped } = placeTeam(ballot, index, team);
    if (dropped) {
      replaceBallot(next, `${nameOf(dropped)} dropped off`);
    } else {
      setBallot(next);
    }
  }

  /** Adds a team from the eligible list to the first empty rank. */
  function add(team: string) {
    const index = ballot.indexOf("");
    startBallot();
    setBallot(placeTeam(ballot, index, team).ballot);
    toast(`${nameOf(team)} added at #${index + 1}`);
  }

  function clearAll() {
    startBallot();
    replaceBallot(EMPTY_BALLOT, "Ballot cleared");
  }

  function copyLastWeek() {
    analytics?.capture("previous_ballot_populated", {
      previous_ballot_count: lastWeek.size,
    });
    fillPreviousBallot();
  }

  function announce(message: ReorderMessage) {
    return message.type === "move" || message.type === "drop"
      ? `${message.label}, moved to ${message.position} of ${message.total}`
      : reorderMessage(message);
  }

  function fillPreviousBallot() {
    const next = RANKS.map(
      (rank) =>
        previousBallot?.find((entry) => entry.rank === rank)?.teamId ?? "",
    );
    if (rankedCount) {
      replaceBallot(next, "Filled in your previous ballot");
    } else {
      setBallot(next);
      toast.success("Form populated with your previous ballot");
    }
  }

  /** Asks to confirm a complete ballot, else shows what's missing. */
  async function review() {
    setAttempted(true);
    if (await form.trigger()) {
      setConfirming(true);
      return;
    }
    document.getElementById(pickerId(ballot.indexOf("") + 1))?.focus();
  }

  async function onSubmit(values: Top25Values) {
    values = { ...values, division, sport };

    await toast.promise(
      fetch(`/api/vote/college/${sport}/rankings/${division}`, {
        method: submit.method,
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ error: "Unknown error" }));
          const errorMessage =
            errorData.error || `HTTP ${res.status}: ${res.statusText}`;
          analytics?.capture("ballot_submission_error", {
            sport,
            division,
            error_message: errorMessage,
            status_code: res.status,
          });
          throw new Error(errorMessage);
        }

        const data = await res.json();
        router.push(`/vote/college/${sport}/${division}/confirmation`);
        return data;
      }),
      {
        loading: submit.loading,
        success: (data: { message?: string }) =>
          data?.message || submit.success,
        error: (err) => (err instanceof Error && err.message) || submit.error,
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]"
      >
        <div
          data-attempted={(attempted && spotsLeft > 0) || undefined}
          className="flex gap-3 rounded-lg border p-4 data-attempted:border-destructive/50 data-attempted:bg-destructive/5 lg:col-span-2"
        >
          {spotsLeft ? (
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CircleCheck
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-up"
            />
          )}
          <div className="grid gap-1 text-sm">
            <p className="font-medium">
              {spotsLeft
                ? `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`
                : "All 25 ranked"}
            </p>
            <p className="text-muted-foreground">
              {spotsLeft
                ? "Rank 25 teams to submit. You can edit until voting closes."
                : "Review your order, then submit. You can edit until voting closes."}
            </p>
          </div>
        </div>

        <SegmentedControl
          aria-label="Show"
          value={view}
          onValueChange={(next) => setView(next as "ballot" | "teams")}
          className="h-11 w-full lg:hidden"
        >
          <SegmentedControlItem value="ballot">
            Ballot {rankedCount}/25
          </SegmentedControlItem>
          <SegmentedControlItem value="teams">Add teams</SegmentedControlItem>
        </SegmentedControl>

        <section
          aria-labelledby="ranking-title"
          className={cn("grid gap-3", view === "teams" && "max-lg:hidden")}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="ranking-title"
              className="font-display text-xl font-bold uppercase"
            >
              Ranking
            </h2>
            <div className="flex gap-2">
              {hasPreviousBallot ? (
                <Button type="button" variant="outline" onClick={copyLastWeek}>
                  Copy last week
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                disabled={!rankedCount}
                onClick={clearAll}
              >
                Clear
              </Button>
            </div>
          </div>
          <p id="ballot-reorder-help" className="sr-only">
            To move a team, press Alt with the up or down arrow, or press Space
            on its reorder button and use the arrows.
          </p>
          <SortableList
            aria-label="Your Top 25"
            className="grid gap-1.5"
            value={keys}
            onValueChange={(next) => {
              startBallot();
              setBallot(next.map((key) => (key.startsWith(EMPTY) ? "" : key)));
            }}
            isDisabled={(key) => key.startsWith(EMPTY)}
            label={(key) => nameOf(key)}
            message={announce}
          >
            {({ order }) =>
              order.map((key, index) => {
                const rank = index + 1;
                const team = key.startsWith(EMPTY) ? "" : key;
                const school = schoolsById.get(team);
                const name = team ? nameOf(team) : "";
                const previous = lastWeek.get(team);
                const meta = [
                  school && conferenceOf(school),
                  previous ? `your #${previous} last week` : undefined,
                ].filter(Boolean);
                return (
                  <SortableListItem
                    key={key}
                    value={key}
                    aria-describedby={team ? "ballot-reorder-help" : undefined}
                    className={cn(
                      "relative flex items-start gap-1 rounded-lg border bg-card p-1 data-dragging:z-10 data-dragging:translate-x-(--drag-x) data-dragging:translate-y-(--drag-y) data-dragging:shadow-lg data-grabbed:ring-2 data-grabbed:ring-primary/50",
                      !team && "border-dashed bg-transparent",
                    )}
                  >
                    {team ? (
                      <SortableListHandle
                        aria-label={`Reorder ${name}`}
                        className={cn(
                          rowButton,
                          "hidden cursor-grab touch-none active:cursor-grabbing aria-pressed:bg-accent pointer-fine:inline-flex",
                        )}
                      >
                        <GripVertical aria-hidden className="size-4" />
                      </SortableListHandle>
                    ) : (
                      <span
                        aria-hidden
                        className="hidden size-11 shrink-0 pointer-fine:block"
                      />
                    )}
                    <span
                      aria-hidden
                      className="flex h-11 w-7 shrink-0 items-center justify-end font-display text-lg font-bold tabular"
                    >
                      {rank}
                    </span>
                    <FormField
                      control={form.control}
                      // @ts-expect-error zodResolver doesn't support this
                      name={`rank_${rank}`}
                      render={({ field }) => (
                        <FormItem className="min-w-0 flex-1 gap-0">
                          <VirtualizedCombobox
                            id={pickerId(rank)}
                            aria-label={`Rank ${rank}: ${name || "empty"}`}
                            options={schools}
                            value={field.value}
                            onChange={(next) => pick(index, next)}
                            ballot={ballot}
                            searchPlaceholder="Pick a team"
                            triggerClassName="h-auto min-h-11 border-transparent bg-transparent px-2 py-1 shadow-none hover:bg-accent dark:bg-transparent"
                          >
                            {school ? (
                              <span className="flex min-w-0 items-center gap-2 text-left">
                                <span className="flex size-7 shrink-0 items-center justify-center">
                                  {school.image ? (
                                    <CustomImage
                                      image={school.image}
                                      width={32}
                                      height={32}
                                      className="size-7 object-contain"
                                    />
                                  ) : null}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">
                                    {name}
                                  </span>
                                  {meta.length ? (
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {meta.join(" · ")}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            ) : null}
                          </VirtualizedCombobox>
                          <FormMessage className="px-2 pb-1" />
                        </FormItem>
                      )}
                    />
                    {team ? (
                      <>
                        <SortableListUp
                          aria-label={`Move ${name} up`}
                          className={rowButton}
                        >
                          <ArrowUp aria-hidden className="size-4" />
                        </SortableListUp>
                        <SortableListDown
                          aria-label={`Move ${name} down`}
                          className={rowButton}
                        >
                          <ArrowDown aria-hidden className="size-4" />
                        </SortableListDown>
                        <button
                          type="button"
                          aria-label={`Remove ${name} from rank ${rank}`}
                          className={rowButton}
                          onClick={() => pick(index, "")}
                        >
                          <XIcon aria-hidden className="size-4" />
                        </button>
                      </>
                    ) : null}
                  </SortableListItem>
                );
              })
            }
          </SortableList>
        </section>

        <EligibleTeams
          schools={schools}
          ballot={ballot}
          lastWeek={lastWeek}
          onAdd={add}
          className={cn(
            "rounded-xl border bg-card p-4 lg:sticky lg:top-20 lg:max-h-[min(36rem,calc(100dvh-11rem))]",
            view === "ballot" && "max-lg:hidden",
          )}
        />

        <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:col-span-2">
          <Meter
            value={rankedCount}
            max={25}
            format={(value) => `${value} of 25`}
            className="grid flex-1 gap-1.5"
          >
            <div className="flex items-center gap-1 text-sm">
              <MeterValue className="tabular font-medium" />
              <MeterLabel className="font-medium">ranked</MeterLabel>
            </div>
            <MeterTrack />
          </Meter>
          <Button
            type="button"
            onClick={review}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" size={16} />{" "}
                {submit.loading}
              </>
            ) : (
              submit.button
            )}
          </Button>
        </div>

        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent className="sm:max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{submit.confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                You can still change it until voting closes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ol
              aria-label="Your ballot"
              className="grid max-h-[50dvh] grid-flow-col grid-rows-[repeat(13,auto)] gap-x-6 gap-y-1 overflow-y-auto text-sm"
            >
              {ballot.map((team, index) => (
                <li key={team || index} className="flex gap-2">
                  <span className="w-6 text-right font-bold tabular">
                    {index + 1}
                  </span>
                  <span className="truncate">{nameOf(team)}</span>
                </li>
              ))}
            </ol>
            <AlertDialogFooter>
              <AlertDialogClose>Keep editing</AlertDialogClose>
              <AlertDialogClose
                variant="default"
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                {submit.confirm}
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
}

const rowButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-disabled:pointer-events-none aria-disabled:opacity-40";

function pickerId(rank: number) {
  return `ballot-rank-${rank}`;
}

export function CreateTop25({
  schools,
  previousBallot,
}: Omit<Top25FormProps, "currentBallot" | "submit">) {
  return (
    <Top25Form
      schools={schools}
      previousBallot={previousBallot}
      submit={{
        button: "Submit",
        loading: "Submitting Ballot",
        method: "POST",
        success: "Ballot submitted successfully",
        error: "An error occurred while submitting your ballot",
        confirmTitle: "Submit your ballot?",
        confirm: "Yes, submit",
      }}
    />
  );
}

export function EditTop25({
  schools,
  currentBallot,
}: Omit<Top25FormProps, "previousBallot" | "submit">) {
  return (
    <Top25Form
      schools={schools}
      currentBallot={currentBallot}
      submit={{
        button: "Save changes",
        loading: "Saving Ballot",
        method: "PATCH",
        success: "Ballot updated successfully",
        error: "An error occurred while saving your ballot",
        confirmTitle: "Save your changes?",
        confirm: "Yes, save",
      }}
    />
  );
}

export default CreateTop25;
