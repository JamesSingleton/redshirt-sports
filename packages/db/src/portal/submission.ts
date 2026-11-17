import { z } from "zod";

import { PLAYER_SUBMITTER_ROLES, PORTAL_SPORT_SLUGS } from "./constants";

/**
 * What the public "report a move" form sends, and what
 * `player_submissions.payload` stores. One schema for the form, the server
 * action, and the admin inbox, so they can't drift.
 */

/** What the submitter says happened. "other" covers visits, offers, corrections. */
export const SUBMISSION_MOVES = [
  "entered",
  "committed",
  "withdrew",
  "other",
] as const;
export type SubmissionMove = (typeof SUBMISSION_MOVES)[number];

export const SUBMISSION_MOVE_LABELS: Record<SubmissionMove, string> = {
  entered: "Entered the transfer portal",
  committed: "Committed to a new school",
  withdrew: "Withdrew from the portal",
  other: "Something else",
};

export const SUBMITTER_ROLE_LABELS: Record<
  (typeof PLAYER_SUBMITTER_ROLES)[number],
  string
> = {
  player: "The player",
  parent: "A parent or guardian",
  coach: "A coach",
  agent: "An agent or representative",
  other: "Someone else",
};

const text = (max: number) => z.string().trim().max(max);
const required = (label: string, max: number) =>
  text(max).min(1, `${label} is required.`);
/** Optional text: blank becomes absent. */
const optional = (max: number) =>
  text(max)
    .optional()
    .transform((value) => value || undefined);

/** The move itself: stored as the submission's payload. */
export const submissionPayloadSchema = z
  .object({
    v: z.literal(1).default(1),
    playerFirstName: required("The player's first name", 80),
    playerLastName: required("The player's last name", 80),
    sportSlug: z.enum(PORTAL_SPORT_SLUGS as [string, ...string[]], {
      message: "Pick a sport.",
    }),
    position: optional(40),
    currentSchool: required("The player's current school", 120),
    move: z.enum(SUBMISSION_MOVES, { message: "Pick what happened." }),
    destinationSchool: optional(120),
    /** The day it happened, as the date input sends it. */
    happenedOn: z
      .string()
      .trim()
      .superRefine((value, context) => {
        // One message per problem: the wrong shape, then an impossible day.
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          context.addIssue({
            code: "custom",
            message: "Use a date like 2026-01-15.",
          });
          return;
        }
        const time = Date.parse(value);
        // A real calendar day reads back the same (Feb 31 doesn't).
        const real =
          !Number.isNaN(time) &&
          new Date(time).toISOString().slice(0, 10) === value;
        if (!real) {
          context.addIssue({ code: "custom", message: "Not a real date." });
        } else if (time > Date.now() + 86_400_000) {
          context.addIssue({
            code: "custom",
            message: "That date is in the future.",
          });
        }
      })
      .optional()
      .or(z.literal("").transform(() => undefined)),
    link: text(500)
      .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), {
        message: "The link must start with https://",
      })
      .optional()
      .transform((value) => value || undefined),
    note: optional(1000),
  })
  .superRefine((payload, context) => {
    if (payload.move === "committed" && !payload.destinationSchool) {
      context.addIssue({
        code: "custom",
        path: ["destinationSchool"],
        message: "Which school did they commit to?",
      });
    }
    if (payload.move === "other" && !payload.note) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Tell us what happened.",
      });
    }
  });

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

/** Who's telling us, so we can follow up. Never published. */
export const submitterSchema = z.object({
  submitterRole: z.enum(PLAYER_SUBMITTER_ROLES, {
    message: "Tell us who you are.",
  }),
  submitterName: required("Your name", 120),
  submitterEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Enter a valid email address.")),
});

export type Submitter = z.infer<typeof submitterSchema>;
