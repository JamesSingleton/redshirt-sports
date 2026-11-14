import { and, eq, inArray, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  playerDuplicateDismissalsTable,
  playerSportsTable,
  playersTable,
  recruitmentEventsTable,
  recruitmentsTable,
  sportsTable,
} from "../schema";
import {
  lockPlayer,
  markPlayerPending,
  PortalWriteError,
  requireActivePlayer,
  writePlayerAudit,
} from "./players";

// Finding and merging players entered twice. Admin only.

export interface DuplicateCandidate {
  /** Smaller id first, as in `player_duplicate_dismissals`. */
  playerAId: number;
  playerBId: number;
  /** Trigram similarity of the two names, 0 to 1. */
  score: number;
  sameSchool: boolean;
  sameHometown: boolean;
  sameClass: boolean;
}

/** How far back the queue looks for newly added players. */
const DEFAULT_RECENT_DAYS = 90;
/** Bounds the work: at most this many recent players, each compared with its closest names. */
const MAX_RECENT_PLAYERS = 500;
const MATCHES_PER_PLAYER = 10;
/** Name similarity needed when the only other thing in common is the high school class. */
const CLASS_ONLY_MIN_SCORE = 0.6;

/**
 * Pairs that are probably one person: similar names (the trigram index on
 * `players.name_search`), at least one sport in common, and also the same
 * school, hometown, or high school class. Pairs an admin already called
 * different people are left out. Best match first.
 *
 * Duplicates are made by adding a player, so only pairs where at least one
 * player was added in the last `recentDays` are checked. Each recent player
 * is compared with its closest names through the index, never with the whole
 * table, so the cost tracks how many players were added, not how many exist.
 */
export async function listDuplicateCandidates({
  limit = 25,
  recentDays = DEFAULT_RECENT_DAYS,
}: {
  limit?: number;
  recentDays?: number;
} = {}): Promise<DuplicateCandidate[]> {
  const rows = await db.execute<{
    a_id: number;
    b_id: number;
    score: number;
    same_school: boolean;
    same_hometown: boolean;
    same_class: boolean;
  }>(sql`
    with recent as (
      select id, name_search
      from public.players
      where created_at > now() - make_interval(days => ${recentDays})
        and merged_into_id is null
      order by created_at desc
      limit ${MAX_RECENT_PLAYERS}
    ),
    pairs as (
      select least(r.id, m.id) as a_id, greatest(r.id, m.id) as b_id,
             max(m.score) as score
      from recent r
      cross join lateral (
        select o.id, extensions.similarity(o.name_search, r.name_search) as score
        from public.players o
        where o.name_search operator(extensions.%) r.name_search
          and o.id <> r.id
          and o.merged_into_id is null
        order by score desc
        limit ${MATCHES_PER_PLAYER}
      ) m
      group by 1, 2
    ),
    involved as (
      select a_id as player_id from pairs union select b_id from pairs
    ),
    -- Every school a player was at or headed to, per sport. Free-text schools
    -- compare by lowercased name.
    schools as (
      select ps.player_id, ps.sport_id,
             coalesce(e.school_id, 'name:' || lower(e.school_name)) as school_key
      from public.player_enrollments e
      join public.player_sports ps on ps.id = e.player_sport_id
      where ps.player_id in (select player_id from involved)
      union
      select ps.player_id, ps.sport_id,
             coalesce(r.destination_school_id, 'name:' || lower(r.destination_school_name))
      from public.recruitments r
      join public.player_sports ps on ps.id = r.player_sport_id
      where ps.player_id in (select player_id from involved)
        and (r.destination_school_id is not null or r.destination_school_name is not null)
    ),
    signals as (
      select p.a_id, p.b_id, p.score,
             exists (
               select 1 from schools sa
               join schools sb on sb.sport_id = sa.sport_id and sb.school_key = sa.school_key
               where sa.player_id = p.a_id and sb.player_id = p.b_id
             ) as same_school,
             (a.hometown_city is not null
              and lower(a.hometown_city) = lower(b.hometown_city)
              and lower(coalesce(a.hometown_state, '')) = lower(coalesce(b.hometown_state, '')))
               as same_hometown,
             (a.hs_grad_year is not null and a.hs_grad_year = b.hs_grad_year) as same_class
      from pairs p
      join public.players a on a.id = p.a_id
      join public.players b on b.id = p.b_id
      where exists (
              select 1 from public.player_sports sa
              join public.player_sports sb on sb.sport_id = sa.sport_id
              where sa.player_id = p.a_id and sb.player_id = p.b_id
            )
        and not exists (
              select 1 from public.player_duplicate_dismissals d
              where d.player_a_id = p.a_id and d.player_b_id = p.b_id
            )
    )
    select a_id, b_id, score, same_school, same_hometown, same_class
    from signals
    -- Six or so classes share thousands of players, so a class alone needs a closer name.
    where same_school or same_hometown or (same_class and score >= ${CLASS_ONLY_MIN_SCORE})
    order by score desc, a_id, b_id
    limit ${limit}
  `);
  return rows.map((row) => ({
    playerAId: Number(row.a_id),
    playerBId: Number(row.b_id),
    score: Number(row.score),
    sameSchool: row.same_school,
    sameHometown: row.same_hometown,
    sameClass: row.same_class,
  }));
}

/** Record that two players are different people, so the queue stops pairing them. */
export async function dismissDuplicate(input: {
  playerIds: [number, number];
  actorUserId?: string | null;
}) {
  const [a, b] = [...input.playerIds].sort((x, y) => x - y) as [number, number];
  if (a === b) {
    throw new PortalWriteError(
      "merge_same_player",
      "Pick two different players.",
    );
  }
  await db
    .insert(playerDuplicateDismissalsTable)
    .values({
      playerAId: a,
      playerBId: b,
      dismissedByUserId: input.actorUserId ?? null,
    })
    .onConflictDoNothing({
      target: [
        playerDuplicateDismissalsTable.playerAId,
        playerDuplicateDismissalsTable.playerBId,
      ],
    });
}

export interface MergeSportPlan {
  sportId: string;
  sportName: string;
  /** `move`: the survivor has no history in this sport, so it all moves over.
   *  `keep`: both have one; the survivor's wins and the other stays on the merged record. */
  action: "move" | "keep";
  recruitments: number;
  events: number;
}

async function loserSportPlan(
  executor: Pick<typeof db, "select">,
  survivorId: number,
  loserId: number,
): Promise<MergeSportPlan[]> {
  const survivorSportIds = new Set(
    (
      await executor
        .select({ sportId: playerSportsTable.sportId })
        .from(playerSportsTable)
        .where(eq(playerSportsTable.playerId, survivorId))
    ).map((row) => row.sportId),
  );
  const rows = await executor
    .select({
      sportId: playerSportsTable.sportId,
      sportName: sportsTable.name,
      recruitments: sql<number>`count(distinct ${recruitmentsTable.id})::int`,
      events: sql<number>`count(${recruitmentEventsTable.id}) filter (where ${recruitmentEventsTable.voidedAt} is null)::int`,
    })
    .from(playerSportsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, playerSportsTable.sportId))
    .leftJoin(
      recruitmentsTable,
      eq(recruitmentsTable.playerSportId, playerSportsTable.id),
    )
    .leftJoin(
      recruitmentEventsTable,
      eq(recruitmentEventsTable.recruitmentId, recruitmentsTable.id),
    )
    .where(eq(playerSportsTable.playerId, loserId))
    .groupBy(playerSportsTable.sportId, sportsTable.name)
    .orderBy(sportsTable.name);
  return rows.map((row) => ({
    sportId: row.sportId,
    sportName: row.sportName,
    action: survivorSportIds.has(row.sportId) ? "keep" : "move",
    recruitments: Number(row.recruitments),
    events: Number(row.events),
  }));
}

/** What `mergePlayers` would do, for the confirmation screen. */
export function previewMerge(survivorId: number, loserId: number) {
  return loserSportPlan(db, survivorId, loserId);
}

/**
 * Merge `loserId` into `survivorId`.
 *
 * - A sport only the loser has moves to the survivor whole: its schools,
 *   portal entries, events, and offers.
 * - A sport both have keeps the survivor's history. The loser's stays attached
 *   to the merged record (nothing is deleted) and is no longer published.
 *   Missing position, height, or weight are filled from the loser.
 * - Blank bio fields on the survivor are filled from the loser.
 * - The loser becomes a tombstone (`merged_into_id`), so after the next push
 *   its URL redirects to the survivor. Players merged into the loser earlier
 *   now point straight at the survivor.
 *
 * Both players are locked (lower id first, so two merges can't deadlock) and
 * marked pending.
 */
export async function mergePlayers(input: {
  survivorId: number;
  loserId: number;
  actorUserId?: string | null;
}) {
  const { survivorId, loserId } = input;
  if (survivorId === loserId) {
    throw new PortalWriteError(
      "merge_same_player",
      "Pick two different players.",
    );
  }
  return db.transaction(async (tx) => {
    for (const id of [survivorId, loserId].sort((a, b) => a - b)) {
      await lockPlayer(tx, id);
    }
    await requireActivePlayer(tx, survivorId);
    await requireActivePlayer(tx, loserId);

    const plan = await loserSportPlan(tx, survivorId, loserId);
    const moving = plan
      .filter((sport) => sport.action === "move")
      .map((sport) => sport.sportId);
    if (moving.length > 0) {
      await tx
        .update(playerSportsTable)
        .set({ playerId: survivorId })
        .where(
          and(
            eq(playerSportsTable.playerId, loserId),
            inArray(playerSportsTable.sportId, moving),
          ),
        );
    }
    // Shared sports: fill the survivor's blanks from the loser.
    await tx.execute(sql`
      update public.player_sports s
      set position = coalesce(s.position, l.position),
          height_in = coalesce(s.height_in, l.height_in),
          weight_lb = coalesce(s.weight_lb, l.weight_lb),
          updated_at = now()
      from public.player_sports l
      where s.player_id = ${survivorId} and l.player_id = ${loserId}
        and l.sport_id = s.sport_id
    `);
    await tx.execute(sql`
      update public.players s
      set hometown_city = coalesce(s.hometown_city, l.hometown_city),
          hometown_state = coalesce(s.hometown_state, l.hometown_state),
          high_school_name = coalesce(s.high_school_name, l.high_school_name),
          hs_grad_year = coalesce(s.hs_grad_year, l.hs_grad_year),
          updated_at = now()
      from public.players l
      where s.id = ${survivorId} and l.id = ${loserId}
    `);

    await tx
      .update(playersTable)
      .set({ mergedIntoId: survivorId })
      .where(eq(playersTable.id, loserId));
    // Earlier tombstones pointing at the loser now point at the survivor, and
    // republish so their redirect skips the extra hop.
    const repointed = await tx
      .update(playersTable)
      .set({ mergedIntoId: survivorId, pendingSince: sql`now()` })
      .where(eq(playersTable.mergedIntoId, loserId))
      .returning({ id: playersTable.id });
    await tx.execute(sql`
      update public.player_submissions
      set matched_player_id = ${survivorId}
      where matched_player_id = ${loserId}
    `);

    for (const [playerId, role] of [
      [survivorId, "survivor"],
      [loserId, "merged"],
    ] as const) {
      await writePlayerAudit(tx, {
        playerId,
        entity: "players",
        entityId: playerId,
        action: "merge",
        after: {
          role,
          survivorId,
          loserId,
          movedSports: moving,
          keptSports: plan
            .filter((sport) => sport.action === "keep")
            .map((sport) => sport.sportId),
          repointed: repointed.map((row) => row.id),
        },
        actorUserId: input.actorUserId,
      });
      await markPlayerPending(tx, playerId);
    }
    return { plan, repointed: repointed.map((row) => row.id) };
  });
}
