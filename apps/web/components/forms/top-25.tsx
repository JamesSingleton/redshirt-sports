"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { analytics } from "@redshirt-sports/analytics";
import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@redshirt-sports/ui/components/form";
import {
  Meter,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@redshirt-sports/ui/components/meter";
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
import { ArrowDown, ArrowUp, GripVertical, Loader2, XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { type Ballot, clearSlot, placeTeam } from "@/lib/ballot-order";
import type { VoterBallotWithSchool } from "@/types/votes";
import { VirtualizedCombobox } from "../virtualized-combobox";

export type Top25FormRef = {
  populateWithPreviousBallot: () => void;
};

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

type Top25FormProps = {
  schools: SchoolsBySportAndSubgroupingStringQueryResult;
  previousBallot?: VoterBallotWithSchool[];
  currentBallot?: Array<{ teamId: string; rank: number }>;
  ref?: React.Ref<Top25FormRef>;
  submit: {
    button: string;
    loading: string;
    method: "PATCH" | "POST";
    success: string;
    error: string;
  };
};

function Top25Form({
  schools,
  previousBallot,
  currentBallot,
  ref,
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
  const schoolNames = useMemo(
    () =>
      new Map(
        schools.map((school) => [school._id, school.shortName ?? school.name]),
      ),
    [schools],
  );
  const nameOf = (team: string) => schoolNames.get(team) ?? team;

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
  const formRef = useRef<HTMLFormElement>(null);
  const focusRank = useRef<number | null>(null);
  useEffect(() => {
    if (focusRank.current === null) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[aria-label="Rank ${focusRank.current}"]`)
      ?.focus();
    focusRank.current = null;
  });

  /** Writes a whole ballot back to the rank fields that changed. */
  function setBallot(next: Ballot) {
    next.forEach((team, index) => {
      const name = `rank_${index + 1}` as RankField;
      if ((form.getValues(name) ?? "") === team) return;
      form.setValue(name, team, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  }

  function pick(index: number, team: string) {
    startBallot();
    focusRank.current = index + 1;
    if (!team) {
      setBallot(clearSlot(ballot, index));
      return;
    }
    const before = ballot;
    const { ballot: next, dropped } = placeTeam(ballot, index, team);
    setBallot(next);
    if (dropped) {
      toast(`${nameOf(dropped)} dropped off`, {
        action: { label: "Undo", onAction: () => setBallot(before) },
      });
    }
  }

  function announce(message: ReorderMessage) {
    return message.type === "move" || message.type === "drop"
      ? `${message.label}, moved to ${message.position} of ${message.total}`
      : reorderMessage(message);
  }

  useImperativeHandle(ref, () => ({
    populateWithPreviousBallot,
  }));

  function populateWithPreviousBallot() {
    if (!previousBallot || previousBallot.length === 0) return;

    previousBallot.forEach((ballot) => {
      form.setValue(
        `rank_${ballot.rank}` as keyof z.infer<typeof formSchema>,
        ballot.teamId,
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        },
      );
    });

    toast.success("Form populated with your previous ballot");
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
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto space-y-6"
      >
        <Meter
          value={rankedCount}
          max={25}
          format={(value) => `${value} of 25`}
          className="sticky top-14 z-10 grid gap-2 border-b bg-background/95 py-3 backdrop-blur lg:top-16"
        >
          <div className="flex items-center justify-between text-sm">
            <MeterLabel className="font-medium">Teams ranked</MeterLabel>
            <MeterValue className="tabular text-muted-foreground" />
          </div>
          <MeterTrack />
        </Meter>
        <p id="ballot-reorder-help" className="sr-only">
          To move a team, press Alt with the up or down arrow, or press Space on
          its reorder button and use the arrows.
        </p>
        <SortableList
          aria-label="Your Top 25"
          className="space-y-6"
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
              const name = team ? nameOf(team) : "";
              return (
                <SortableListItem
                  key={key}
                  value={key}
                  aria-describedby={team ? "ballot-reorder-help" : undefined}
                  className="relative rounded-md bg-background data-dragging:z-10 data-dragging:translate-x-(--drag-x) data-dragging:translate-y-(--drag-y) data-dragging:shadow-lg data-grabbed:ring-2 data-grabbed:ring-ring"
                >
                  <FormField
                    control={form.control}
                    // @ts-expect-error zodResolver doesn't support this
                    name={`rank_${rank}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Rank {rank}</FormLabel>
                        <div className="flex items-center gap-1">
                          {team ? (
                            <SortableListHandle
                              aria-label={`Reorder ${name}`}
                              className="hidden size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing aria-pressed:bg-accent pointer-fine:inline-flex"
                            >
                              <GripVertical aria-hidden className="size-4" />
                            </SortableListHandle>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <VirtualizedCombobox
                              aria-label={`Rank ${rank}`}
                              options={schools}
                              value={field.value}
                              onChange={(next) => pick(index, next)}
                              ballot={ballot}
                            />
                          </div>
                          {team ? (
                            <>
                              <SortableListUp
                                aria-label={`Move ${name} up`}
                                className={rowButton("pointer-fine:hidden")}
                              >
                                <ArrowUp aria-hidden className="size-4" />
                              </SortableListUp>
                              <SortableListDown
                                aria-label={`Move ${name} down`}
                                className={rowButton("pointer-fine:hidden")}
                              >
                                <ArrowDown aria-hidden className="size-4" />
                              </SortableListDown>
                              <button
                                type="button"
                                aria-label={`Remove ${name} from rank ${rank}`}
                                className={rowButton()}
                                onClick={() => pick(index, "")}
                              >
                                <XIcon aria-hidden className="size-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </SortableListItem>
              );
            })
          }
        </SortableList>
        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
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
      </form>
    </Form>
  );
}

function rowButton(extra?: string) {
  return [
    "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-disabled:pointer-events-none aria-disabled:opacity-40",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function CreateTop25({
  schools,
  previousBallot,
  ref,
}: Omit<Top25FormProps, "currentBallot" | "submit">) {
  return (
    <Top25Form
      ref={ref}
      schools={schools}
      previousBallot={previousBallot}
      submit={{
        button: "Submit",
        loading: "Submitting Ballot",
        method: "POST",
        success: "Ballot submitted successfully",
        error: "An error occurred while submitting your ballot",
      }}
    />
  );
}

export function EditTop25({
  schools,
  currentBallot,
  ref,
}: Omit<Top25FormProps, "previousBallot" | "submit">) {
  return (
    <Top25Form
      ref={ref}
      schools={schools}
      currentBallot={currentBallot}
      submit={{
        button: "Save changes",
        loading: "Saving Ballot",
        method: "PATCH",
        success: "Ballot updated successfully",
        error: "An error occurred while saving your ballot",
      }}
    />
  );
}

export default CreateTop25;
