"use server";

import { auth } from "@redshirt-sports/auth/server";
import {
  type EspnPlayerProfile,
  espnPlayerProfile,
  fetchEspnAthlete,
  parseEspnPlayerUrl,
} from "@redshirt-sports/clients/espn";
import {
  EVENT_SOURCE_TYPES,
  PLAYER_CLASS_CODES,
  PLAYER_ID_PROVIDERS,
  PLAYER_SUBMISSION_STATUSES,
  parsePlayerExternalId,
  RECRUITMENT_EVENT_TYPES,
  rankDuplicates,
} from "@redshirt-sports/db/portal";
import {
  addPlayerExternalId,
  createPortalPlayer,
  dismissDuplicate,
  expirePendingPortalPushes,
  findSimilarPlayers,
  getPlayerSubmission,
  getPortalPendingSummary,
  getPortalPlayer,
  listDuplicateCandidates,
  listPlayerExternalIds,
  listPlayerSubmissions,
  listPortalPlayers,
  listPortalSports,
  matchEspnIds,
  mergePlayers,
  openRecruitment,
  PortalWriteError,
  previewMerge,
  previewMergeIdConflicts,
  pushPortal,
  recordRecruitmentEvent,
  recordRecruitmentEvents,
  removePlayerExternalId,
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

/** A pasted ESPN or stats.ncaa.org profile link, or the number in it. */
const externalIdSchema = z
  .object({ provider: z.enum(PLAYER_ID_PROVIDERS), value: z.string().max(300) })
  .transform(({ provider, value }, context) => {
    const externalId = parsePlayerExternalId(provider, value);
    if (!externalId) {
      context.addIssue({
        code: "custom",
        message:
          provider === "espn"
            ? "Paste the player's espn.com page link, or the number after /id/."
            : "Paste the player's stats.ncaa.org page link, or the number after /players/.",
      });
      return z.NEVER;
    }
    return { provider, externalId };
  });

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
  const [player, sports, pending, externalIds] = await Promise.all([
    getPortalPlayer(id),
    listPortalSports(),
    getPortalPendingSummary(),
    listPlayerExternalIds(id),
  ]);
  return player ? { player, sports, pending, externalIds } : null;
}

export type PortalPlayerPage = NonNullable<
  Awaited<ReturnType<typeof getPortalPlayerPage>>
>;

/** Existing players whose names look like this one, shown before creating a new one. */
const duplicateContextSchema = z
  .object({
    sportId: z.string().max(64).nullish(),
    schoolId: z.string().max(64).nullish(),
    hsGradYear: z.coerce
      .number()
      .int()
      .min(1990)
      .max(2100)
      .nullish()
      .catch(null),
  })
  .catch({});

/**
 * Players already on file who may be the one being entered, likely first.
 * `context` (sport, origin school, high-school class) tells namesakes apart.
 */
export async function findPortalDuplicates(name: string, context?: unknown) {
  await requireArea("portal");
  const matches = await findSimilarPlayers(name.slice(0, 200), { limit: 20 });
  return rankDuplicates(matches, duplicateContextSchema.parse(context ?? {}));
}

export type EspnPrefill =
  | { ok: false; message: string }
  | {
      ok: true;
      profile: EspnPlayerProfile;
      sportSlug: string;
      /** Our school for the player's ESPN team; null when ESPN's team isn't mapped. */
      school: { id: string; name: string | null } | null;
      /** The player already on file with this ESPN id. */
      existingPlayer: {
        id: number;
        firstName: string;
        lastName: string;
      } | null;
    };

/** A new player's details from their ESPN profile link. */
export async function prefillFromEspn(url: string): Promise<EspnPrefill> {
  await requireArea("portal");
  const parsed = parseEspnPlayerUrl(String(url ?? ""));
  if (!parsed) {
    return {
      ok: false,
      message:
        "Paste an ESPN college player link, like espn.com/college-football/player/_/id/…",
    };
  }
  try {
    const profile = espnPlayerProfile(
      await fetchEspnAthlete(parsed.sport, parsed.id),
    );
    const { existingPlayer, school } = await matchEspnIds({
      espnPlayerId: profile.espnId,
      espnTeamId: profile.espnTeamId,
    });
    return {
      ok: true,
      profile,
      sportSlug: parsed.sport,
      school,
      existingPlayer: existingPlayer
        ? {
            id: existingPlayer.mergedIntoId ?? existingPlayer.id,
            firstName: existingPlayer.firstName,
            lastName: existingPlayer.lastName,
          }
        : null,
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      ok: false,
      message: "ESPN didn't return that player. Check the link.",
    };
  }
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
  /** The ESPN id the form was filled from, recorded on the new player. */
  espnId?: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const espnId = z
    .string()
    .regex(/^\d{1,12}$/)
    .nullish()
    .safeParse(input.espnId);
  if (!espnId.success) return invalid(espnId.error);
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
    if (espnId.data) {
      const { existingPlayer } = await matchEspnIds({
        espnPlayerId: espnId.data,
        espnTeamId: null,
      });
      if (existingPlayer) {
        return {
          ok: false,
          message: `This ESPN player is already on file as ${existingPlayer.firstName} ${existingPlayer.lastName} (#${existingPlayer.mergedIntoId ?? existingPlayer.id}).`,
        };
      }
    }
    const player = await createPortalPlayer({
      notDuplicateOf: notDuplicateOf.data,
      ...bio.data,
      actorUserId,
      entry: entry?.data ?? null,
    });
    if (espnId.data) {
      await addPlayerExternalId({
        playerId: player.id,
        provider: "espn",
        externalId: espnId.data,
        actorUserId,
      });
    }
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

/**
 * Several moves on one portal entry in one save, all or none: offers from
 * three schools on the same day, say.
 */
export async function recordPortalMoves(input: {
  playerId: unknown;
  moves: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  if (!id.success) return invalid(id.error);
  const moves = z.array(moveSchema).min(1).max(12).safeParse(input.moves);
  if (!moves.success) return invalid(moves.error);
  try {
    const actorUserId = await actorId();
    await recordRecruitmentEvents(
      moves.data.map((move) => ({ ...move, actorUserId })),
    );
    refresh(id.data);
    const count = moves.data.length;
    return {
      ok: true,
      message: count === 1 ? "Saved." : `Saved ${count} moves.`,
      playerId: id.data,
    };
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

// ---------- Public ids (ESPN, NCAA stats) ----------

/** Internal only: used to match players, never shown on the site. */
export async function addPlayerExternalIdAction(input: {
  playerId: unknown;
  provider: unknown;
  value: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const id = playerId.safeParse(input.playerId);
  if (!id.success) return invalid(id.error);
  const parsed = externalIdSchema.safeParse({
    provider: input.provider,
    value: input.value,
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await addPlayerExternalId({
      ...parsed.data,
      playerId: id.data,
      actorUserId: await actorId(),
    });
    revalidatePath(`/portal/players/${id.data}`);
    return { ok: true, message: "Id added.", playerId: id.data };
  } catch (error) {
    return failure(error);
  }
}

export async function removePlayerExternalIdAction(input: {
  playerId: unknown;
  id: unknown;
}): Promise<PortalActionResult> {
  await requireArea("portal");
  const player = playerId.safeParse(input.playerId);
  if (!player.success) return invalid(player.error);
  const id = positiveId.safeParse(input.id);
  if (!id.success) return invalid(id.error);
  try {
    await removePlayerExternalId({
      playerId: player.data,
      id: id.data,
      actorUserId: await actorId(),
    });
    revalidatePath(`/portal/players/${player.data}`);
    return { ok: true, message: "Id removed.", playerId: player.data };
  } catch (error) {
    return failure(error);
  }
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
  const [keepA, keepB, idConflicts] = await Promise.all([
    previewMerge(a.id, b.id),
    previewMerge(b.id, a.id),
    // The same either way round: a provider where each has a different id.
    previewMergeIdConflicts(a.id, b.id),
  ]);
  return { a, b, keepA, keepB, idConflicts };
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
