"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { analytics } from "@redshirt-sports/analytics";
import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@redshirt-sports/ui/components/form";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { VoterBallotWithSchool } from "@/types/votes";
import { VirtualizedCombobox } from "../virtualized-combobox";

export type Top25FormRef = {
  populateWithPreviousBallot: () => void;
};

function rankString(rank: number) {
  return z.string({
    error: (issue) =>
      issue.input === undefined
        ? `Please select a team for rank ${rank}.`
        : undefined,
  });
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
        if (Object.values(arg).filter((v) => v === value).length > 1) {
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

const Top25 = forwardRef<
  Top25FormRef,
  {
    schools: SchoolsBySportAndSubgroupingStringQueryResult;
    previousBallot?: VoterBallotWithSchool[];
  }
>(({ schools, previousBallot }, ref) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const formValues = form.watch();
  const selectedValues = useMemo(() => {
    return Object.values(formValues).filter(Boolean) as string[];
  }, [formValues]);

  const params = useParams();
  const { sport, division } = params as {
    sport: string;
    division?: "fbs" | "fcs" | "d2" | "d3" | "mid-major" | "power-conferences";
  };
  const router = useRouter();

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    values = { ...values, division, sport };

    await toast.promise(
      fetch(`/api/vote/college/${sport}/rankings/${division}`, {
        method: "POST",
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
        loading: "Submitting Ballot",
        success: (data: { message?: string }) =>
          data?.message || "Ballot submitted successfully",
        error: (err: Error) =>
          err.message || "An error occurred while submitting your ballot",
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto space-y-6"
      >
        {Array.from({ length: 25 }, (_, i) => i + 1).map((rank) => (
          <FormField
            key={`rank-${rank}`}
            control={form.control}
            // @ts-expect-error zodResolver doesn't support this
            name={`rank_${rank}`}
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Rank {rank}</FormLabel>
                <FormControl>
                  <VirtualizedCombobox
                    options={schools}
                    value={field.value}
                    onChange={field.onChange}
                    selectedOptions={selectedValues}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" size={16} />{" "}
              Submitting Ballot
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
});

Top25.displayName = "Top25";

export default Top25;
