import { z } from "zod";

import { BALLOT_SIZE, VALID_DIVISIONS } from "@/lib/vote-ballot";

export const pollDivisionSchema = z.enum(VALID_DIVISIONS);

type RankKey = `rank_${number}`;

function buildRequiredRankFields() {
  const shape = {} as Record<RankKey, z.ZodString>;

  for (let i = 1; i <= BALLOT_SIZE; i++) {
    const key = `rank_${i}` as RankKey;
    shape[key] = z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? `Please select a team for rank ${i}.`
            : undefined,
      })
      .min(1, `Please select a team for rank ${i}.`);
  }

  return shape;
}

function refineNoDuplicateTeams(
  values: Record<string, string | undefined>,
  ctx: z.RefinementCtx,
) {
  const rankEntries = Object.entries(values).filter(
    ([key, value]) =>
      key.startsWith("rank_") && typeof value === "string" && value.length > 0,
  );

  const seen = new Map<string, string>();
  for (const [key, value] of rankEntries) {
    const previous = seen.get(value!);
    if (previous) {
      for (const duplicateKey of [previous, key]) {
        const rank = duplicateKey.split("_")[1];
        ctx.addIssue({
          code: "custom",
          message: `Duplicate team selected for rank ${rank}`,
          path: [duplicateKey],
        });
      }
    } else {
      seen.set(value!, key);
    }
  }
}

/**
 * Shared Top 25 ballot body: all 25 ranks required and unique.
 * Used by the vote API and the client form.
 */
export const top25BallotSchema = z
  .object({
    division: pollDivisionSchema.optional(),
    sport: z.string().optional(),
    ...buildRequiredRankFields(),
  })
  .superRefine((arg, ctx) => {
    refineNoDuplicateTeams(arg, ctx);
  });

export const voteRequestSchema = top25BallotSchema;
export const top25FormSchema = top25BallotSchema;

export type VoteRequest = z.infer<typeof voteRequestSchema>;
export type Top25FormValues = z.infer<typeof top25FormSchema>;
