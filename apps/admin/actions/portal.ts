"use server";

import { auth } from "@redshirt-sports/auth/server";
import {
  EVENT_SOURCE_TYPES,
  PLAYER_CLASS_CODES,
  PLAYER_SUBMISSION_STATUSES,
  parseStorySlug,
  RECRUITMENT_EVENT_TYPES,
} from "@redshirt-sports/db/portal";
import {
  createPortalPlayer,
  dismissDuplicate,
  expirePendingPortalPushes,
  findSimilarPlayers,
  getPlayerSubmission,
  getPortalPendingSummary,
  getPortalPlayer,
  listDuplicateCandidates,
  listPlayerSubmissions,
  listPortalPlayers,
  listPortalSports,
  mergePlayers,
  openRecruitment,
  PortalWriteError,
  previewMerge,
  pushPortal,
  recordRecruitmentEvent,
  resolvePortalActor,
  reviewPlayerSubmission,
  searchPortalSchools,
  updatePlayerBio,
  updatePlayerSport,
  voidRecruitmentEvent,
} from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireArea } from "@/lib/access";
import { expireWebPortalTags } from "@/lib/revalidate-web-portal";

export type PortalActionResult = {
  ok: boolean;
  message: string;
  /** Set when the action created or touched a player. */
  playerId?: number;
};

// ---------- Input schemas ----------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

const nameField = z.string().trim().min(1, "Required.").max(80);

const schoolSchema = z
  .object({
    schoolId: z.string().trim().min(1).optional().nullable(),
    schoolName: optionalText(120),
  })
  .refine((school) => school.schoolId || school.schoolName, {
    message: "Pick a school, or type its name if it isn't listed.",
  });

const sourceSchema = z.object({
  sourceType: z.enum(EVENT_SOURCE_TYPES).optional().nullable(),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((value) => value || null)
    .refine((value) => value === null || /^https:\/\/\S+$/.test(value), {
      message: "Source link must start with https://",
    }),
  sourceNote: optionalText(500),
  // Public, unlike the fields above: the article this move came from.
  storySlug: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((value, context) => {
      const slug = parseStorySlug(value);
      if (slug === undefined) {
        context.addIssue({
          code: "custom",
          message:
            "Paste the article's link on the site, or its slug (like portal-qb-visits-idaho).",
        });
        return z.NEVER;
      }
      return slug;
    }),
});

/** An event can't be dated more than a day ahead: catches a mistyped year. */
const occurredAt = z.coerce
  .date()
  .refine((date) => date.getTime() <= Date.now() + 86_400_000, {
    message: "That date is in the future.",
  });

/** Blank means "not known"; anything typed must be a whole number in range. */
const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.number().int().min(min).max(max).nullable(),
  );

const attributesSchema = z.object({
  position: optionalText(8),
  heightIn: optionalInt(48, 96),
  weightLb: optionalInt(80, 500),
});

const entrySchema = sourceSchema.extend({
  sportId: z.string().min(1, "Pick a sport."),
  cycleYear: z.coerce.number().int().min(2000).max(2100),
  origin: schoolSchema,
  enteredAt: occurredAt,
  classAtEntry: z.enum(PLAYER_CLASS_CODES).optional().nullable(),
  eligibilityYears: optionalInt(0, 6),
  isGradTransfer: z.boolean().optional(),
  attributes: attributesSchema.optional(),
});

const bioSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  suffix: optionalText(10),
  hometownCity: optionalText(80),
  hometownState: optionalText(40),
  highSchoolName: optionalText(120),
  hsGradYear: optionalInt(1990, 2100),
});

const playerId = z.coerce.number().int().positive();

const moveSchema = sourceSchema
  .extend({
    recruitmentId: z.coerce.number().int().positive(),
    type: z.enum(RECRUITMENT_EVENT_TYPES).exclude(["entered"]),
    occurredAt: z.coerce.date(),
    school: schoolSchema.optional().nullable(),
  })
  .superRefine((move, context) => {
    // A scheduled visit is the one move that's dated ahead (up to a year);
    // anything else more than a day out is a mistyped year.
    const ahead = move.type === "visit_scheduled" ? 366 : 1;
    if (move.occurredAt.getTime() > Date.now() + ahead * 86_400_000) {
      context.addIssue({
        code: "custom",
        path: ["occurredAt"],
        message:
          move.type === "visit_scheduled"
            ? "That visit is more than a year away."
            : "That date is in the future.",
      });
    }
  });

const positiveId = z.coerce.number().int().positive();

// ---------- Helpers ----------

async function actorId() {
  const { userId } = await auth();
  return resolvePortalActor(userId);
}

function invalid(error: z.ZodError): PortalActionResult {
  const issue = error.issues[0];
  const field = issue?.path.join(".");
  return {
    ok: false,
    message: issue
      ? `${field ? `${field}: ` : ""}${issue.message}`
      : "Check the form.",
  };
}

/** Turn a refused write into a message the admin can act on. */
function failure(error: unknown): PortalActionResult {
  if (error instanceof PortalWriteError) {
    return { ok: false, message: error.message };
  }
  const code = (error as { cause?: { code?: string } })?.cause?.code;
  if (code === "23505") {
    return {
      ok: false,
      message:
        "That already exists: a live offer from this school, or an open portal entry.",
    };
  }
  Sentry.captureException(error, { tags: { area: "portal-admin" } });
  return { ok: false, message: "Couldn't save. The error was reported." };
}

function refresh(id?: number) {
  revalidatePath("/portal");
  if (id) revalidatePath(`/portal/players/${id}`);
}

// ---------- Reads ----------

export async function getPortalDesk(input: {
  pendingOnly?: boolean;
  beforeId?: number;
}) {
  await requireArea("portal");
  const [sports, pending, players] = await Promise.all([
    listPortalSports(),
    getPortalPendingSummary(),
    listPortalPlayers({
      pendingOnly: input.pendingOnly,
      beforeId: input.beforeId,
    }),
  ]);
  return { sports, pending, players };
}

export type PortalDesk = Awaited<ReturnType<typeof getPortalDesk>>;

/** Saves waiting for Push to site, for the home page. */
export async function getPortalPending() {
  await requireArea("portal");
  return getPortalPendingSummary();
}

export async function getPortalPlayerPage(id: number) {
  await requireArea("portal");
  const [player, sports, pending] = await Promise.all([
    getPortalPlayer(id),
    listPortalSports(),
    getPortalPendingSummary(),
  ]);
  return player ? { player, sports, pending } : null;
}

export type PortalPlayerPage = NonNullable<
  Awaited<ReturnType<typeof getPortalPlayerPage>>
>;

/** Existing players whose names look like this one, shown before creating a new one. */
export async function findPortalDuplicates(name: string) {
  await requireArea("portal");
  return findSimilarPlayers(name.slice(0, 200));
}

export async function findPortalSchools(query: string) {
  await requireArea("portal");
  return searchPortalSchools(query.slice(0, 80));
}

// ---------- Writes ----------

export async function createPortalPlayerAction(input: {
  bio: unknown;
  entry: unknown | null;
  /** Similar players the admin confirmed are different people. */
  notDuplicateOf?: unknown;
  /** The public submission this player was entered from, to mark it accepted. */
  submissionId?: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const bio = bioSchema.safeParse(input.bio);
  if (!bio.success) return invalid(bio.error);
  const entry =
    input.entry === null ? null : entrySchema.safeParse(input.entry);
  if (entry && !entry.success) return invalid(entry.error);
  const notDuplicateOf = z
    .array(playerId)
    .max(20)
    .default([])
    .safeParse(input.notDuplicateOf);
  if (!notDuplicateOf.success) return invalid(notDuplicateOf.error);
  const submissionId = positiveId
    .optional()
    .nullable()
    .safeParse(input.submissionId);
  if (!submissionId.success) return invalid(submissionId.error);
  try {
    const actorUserId = await actorId();
    const player = await createPortalPlayer({
      notDuplicateOf: notDuplicateOf.data,
      ...bio.data,
      actorUserId,
      entry: entry?.data ?? null,
    });
    if (submissionId.data) {
      await reviewPlayerSubmission({
        id: submissionId.data,
        status: "accepted",
        matchedPlayerId: player.id,
        reviewerUserId: actorUserId,
      });
      revalidatePath("/portal/submissions");
    }
    refresh(player.id);
    return { ok: true, message: "Player saved.", playerId: player.id };
  } catch (error) {
    return failure(error);
  }
}

export async function enterPortal(input: {
  playerId: unknown;
  entry: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  if (!id.success) return invalid(id.error);
  const entry = entrySchema.safeParse(input.entry);
  if (!entry.success) return invalid(entry.error);
  try {
    await openRecruitment({
      ...entry.data,
      playerId: id.data,
      actorUserId: await actorId(),
    });
    refresh(id.data);
    return { ok: true, message: "Entered the portal.", playerId: id.data };
  } catch (error) {
    return failure(error);
  }
}

export async function recordPortalMove(input: {
  playerId: unknown;
  move: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  if (!id.success) return invalid(id.error);
  const move = moveSchema.safeParse(input.move);
  if (!move.success) return invalid(move.error);
  try {
    await recordRecruitmentEvent({
      ...move.data,
      actorUserId: await actorId(),
    });
    refresh(id.data);
    return { ok: true, message: "Saved.", playerId: id.data };
  } catch (error) {
    return failure(error);
  }
}

export async function voidPortalMove(input: {
  playerId: unknown;
  eventId: unknown;
  reason: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  const eventId = z.coerce.number().int().positive().safeParse(input.eventId);
  const reason = optionalText(200).safeParse(input.reason);
  if (!id.success) return invalid(id.error);
  if (!eventId.success) return invalid(eventId.error);
  if (!reason.success) return invalid(reason.error);
  try {
    await voidRecruitmentEvent({
      eventId: eventId.data,
      reason: reason.data,
      actorUserId: await actorId(),
    });
    refresh(id.data);
    return { ok: true, message: "Undone.", playerId: id.data };
  } catch (error) {
    return failure(error);
  }
}

export async function savePlayerBio(input: {
  playerId: unknown;
  bio: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  if (!id.success) return invalid(id.error);
  const bio = bioSchema.safeParse(input.bio);
  if (!bio.success) return invalid(bio.error);
  try {
    await updatePlayerBio({
      ...bio.data,
      playerId: id.data,
      actorUserId: await actorId(),
    });
    refresh(id.data);
    return { ok: true, message: "Saved.", playerId: id.data };
  } catch (error) {
    return failure(error);
  }
}

export async function savePlayerSport(input: {
  playerId: unknown;
  sportId: unknown;
  attributes: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  if (!id.success) return invalid(id.error);
  const sportId = z.string().min(1).safeParse(input.sportId);
  if (!sportId.success) return invalid(sportId.error);
  const attributes = attributesSchema.safeParse(input.attributes);
  if (!attributes.success) return invalid(attributes.error);
  try {
    await updatePlayerSport({
      playerId: id.data,
      sportId: sportId.data,
      attributes: attributes.data,
      actorUserId: await actorId(),
    });
    refresh(id.data);
    return { ok: true, message: "Saved.", playerId: id.data };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Publish every pending change, then refresh the public site's cache. A failed
 * refresh still counts as pushed: the data is live in the published tables and
 * the nightly job retries the refresh.
 */
export async function pushPortalToSite(): Promise<PortalActionResult> {
  await requireArea("portal");
  let pushed: Awaited<ReturnType<typeof pushPortal>>;
  try {
    pushed = await pushPortal({
      trigger: "admin",
      actorUserId: await actorId(),
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { area: "portal-push" } });
    return {
      ok: false,
      message:
        "Push failed and nothing was published. Try again in a minute; the error was reported.",
    };
  }

  const expiry = await expirePendingPortalPushes(expireWebPortalTags);
  refresh();
  const count = pushed?.playerCount ?? 0;
  const published =
    pushed === null
      ? "Nothing was waiting to publish."
      : `Published ${count} player${count === 1 ? "" : "s"}.`;
  if (expiry.failed.length > 0) {
    for (const failure of expiry.failed) {
      Sentry.captureMessage(
        `Portal push ${failure.pushId} cache expiry failed: ${failure.error}`,
        "warning",
      );
    }
    return {
      ok: true,
      message: `${published} The site didn't refresh yet (${expiry.failed[0]!.error}); tonight's job will retry.`,
    };
  }
  return { ok: true, message: published };
}

// ---------- Duplicates ----------

const pairSchema = z
  .tuple([playerId, playerId])
  .refine(([a, b]) => a !== b, { message: "Pick two different players." });

/** Likely duplicates among recently added players, with a card for each player. */
export async function getDuplicateQueue() {
  await requireArea("portal");
  const pairs = await listDuplicateCandidates();
  const ids = [
    ...new Set(pairs.flatMap((pair) => [pair.playerAId, pair.playerBId])),
  ];
  const players = await listPortalPlayers({ ids, limit: ids.length });
  const byId = new Map(players.map((player) => [player.id, player]));
  return pairs.flatMap((pair) => {
    const a = byId.get(pair.playerAId);
    const b = byId.get(pair.playerBId);
    return a && b ? [{ ...pair, a, b }] : [];
  });
}

export type DuplicateQueue = Awaited<ReturnType<typeof getDuplicateQueue>>;

/** Two players side by side, and what merging either way would do. */
export async function getMergeComparison(aId: number, bId: number) {
  await requireArea("portal");
  const [a, b] = await Promise.all([
    getPortalPlayer(aId),
    getPortalPlayer(bId),
  ]);
  if (!a || !b || a.id === b.id) return null;
  const [keepA, keepB] = await Promise.all([
    previewMerge(a.id, b.id),
    previewMerge(b.id, a.id),
  ]);
  return { a, b, keepA, keepB };
}

export type MergeComparison = NonNullable<
  Awaited<ReturnType<typeof getMergeComparison>>
>;

export async function dismissPortalDuplicate(input: {
  playerIds: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const pair = pairSchema.safeParse(input.playerIds);
  if (!pair.success) return invalid(pair.error);
  try {
    await dismissDuplicate({
      playerIds: pair.data,
      actorUserId: await actorId(),
    });
    revalidatePath("/portal/duplicates");
    return { ok: true, message: "Marked as different people." };
  } catch (error) {
    return failure(error);
  }
}

export async function mergePortalPlayers(input: {
  survivorId: unknown;
  loserId: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const pair = pairSchema.safeParse([input.survivorId, input.loserId]);
  if (!pair.success) return invalid(pair.error);
  const [survivorId, loserId] = pair.data;
  try {
    await mergePlayers({ survivorId, loserId, actorUserId: await actorId() });
    refresh(survivorId);
    revalidatePath("/portal/duplicates");
    return {
      ok: true,
      message: `Merged #${loserId} into #${survivorId}. Push to update the site.`,
      playerId: survivorId,
    };
  } catch (error) {
    return failure(error);
  }
}

// ---------- Public submissions ----------

/** The submissions inbox: one status at a time, newest first. */
export async function getSubmissionInbox(input: {
  status?: unknown;
  beforeId?: unknown;
}) {
  await requireArea("portal");
  const status = z
    .enum(PLAYER_SUBMISSION_STATUSES)
    .catch("new")
    .parse(input.status);
  const beforeId = positiveId.optional().catch(undefined).parse(input.beforeId);
  return { status, ...(await listPlayerSubmissions({ status, beforeId })) };
}

export type SubmissionInbox = Awaited<ReturnType<typeof getSubmissionInbox>>;

/** One submission, to prefill the Add player form. Null when it isn't there. */
export async function getSubmissionForEntry(id: unknown) {
  await requireArea("portal");
  const parsed = positiveId.safeParse(id);
  return parsed.success ? getPlayerSubmission(parsed.data) : null;
}

const reviewSchema = z.object({
  id: positiveId,
  status: z.enum(PLAYER_SUBMISSION_STATUSES).exclude(["new"]),
  matchedPlayerId: positiveId.optional().nullable(),
  reviewNote: optionalText(500),
});

/**
 * Close a submission without the Add player form: accepted (the move was
 * recorded on an existing player), rejected, or spam.
 */
export async function reviewSubmission(
  input: unknown,
): Promise<PortalActionResult> {
  await requireArea("portal");
  const review = reviewSchema.safeParse(input);
  if (!review.success) return invalid(review.error);
  try {
    const found = await reviewPlayerSubmission({
      ...review.data,
      reviewerUserId: await actorId(),
    });
    if (!found) return { ok: false, message: "Submission not found." };
    revalidatePath("/portal/submissions");
    return { ok: true, message: "Saved." };
  } catch (error) {
    return failure(error);
  }
}
