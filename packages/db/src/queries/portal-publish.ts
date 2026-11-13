import { asc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  PLAYER_INDEX_TAG,
  playerTag,
  portalWireTag,
} from "../portal/cache-tags";
import type { PortalPushTrigger } from "../portal/constants";
import {
  playerAuditLogTable,
  playersTable,
  portalPushesTable,
} from "../schema";
import { PORTAL_PUSH_LOCK_SQL } from "./players";

/*
 * "Push to site": copy every player with unpublished changes into the
 * published tables the public site reads.
 *
 * Everything is built inside Postgres (INSERT … SELECT producing the JSON), so
 * a push sends back only ids and cache tags, never player data: publishing
 * costs almost no egress however many players it covers.
 */

/** How long a push waits for in-flight saves before giving up. */
const PUSH_LOCK_TIMEOUT = "15s";

// --- SQL fragments, all evaluated against aliases noted beside each ---------

/** `r` = recruitments. A school plus its division and conference, or null. */
const originText = `jsonb_build_object(
  'schoolId', r.origin_school_id, 'schoolName', r.origin_school_name,
  'divisionId', r.origin_division_id, 'conferenceId', r.origin_conference_id)`;

const destinationText = `case
  when r.destination_school_id is null and r.destination_school_name is null then null
  else jsonb_build_object(
    'schoolId', r.destination_school_id, 'schoolName', r.destination_school_name,
    'divisionId', r.destination_division_id, 'conferenceId', r.destination_conference_id)
  end`;

/**
 * `e` = recruitment_events. A commitment or signing the player later dropped
 * (a decommit or withdrawal after it). Matches `reduceRecruitment`'s
 * `supersededEventIds` for any sequence it accepts.
 */
const supersededText = `(e.type in ('committed', 'signed') and exists (
  select 1 from public.recruitment_events d
  where d.recruitment_id = e.recruitment_id
    and d.voided_at is null
    and d.type in ('decommitted', 'withdrew')
    and (d.occurred_at, d.id) > (e.occurred_at, e.id)))`;

const originSql = sql.raw(originText);
const destinationSql = sql.raw(destinationText);
const supersededSql = sql.raw(supersededText);

/** `p` = players. Search engines see a player once they have committed somewhere. */
const indexableSql = sql.raw(`exists (
  select 1 from public.recruitments ir
  join public.player_sports ips on ips.id = ir.player_sport_id
  where ips.player_id = p.id and ir.status in ('committed', 'signed', 'enrolled'))`);

/** `p` = players. The whole profile page, matching `publishedPlayerDocSchema`. */
const playerDocSql = sql.raw(`jsonb_strip_nulls(jsonb_build_object(
  'v', 1, 'id', p.id, 'slug', p.slug,
  'firstName', p.first_name, 'lastName', p.last_name, 'suffix', p.suffix,
  'hometownCity', p.hometown_city, 'hometownState', p.hometown_state,
  'highSchoolName', p.high_school_name, 'hsGradYear', p.hs_grad_year,
  'sports', coalesce((
    select jsonb_agg(jsonb_build_object(
      'sportId', ps.sport_id, 'sportSlug', sp.slug,
      'position', ps.position, 'heightIn', ps.height_in, 'weightLb', ps.weight_lb,
      'enrollments', coalesce((
        select jsonb_agg(jsonb_build_object(
          'schoolId', en.school_id, 'schoolName', en.school_name,
          'startYear', en.start_year, 'endYear', en.end_year
        ) order by en.start_year, en.id)
        from public.player_enrollments en where en.player_sport_id = ps.id
      ), '[]'::jsonb),
      'recruitments', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', r.id, 'kind', r.kind, 'cycleYear', r.cycle_year,
          'status', r.status, 'statusAt', r.status_at,
          'enteredAt', r.entered_at, 'closedAt', r.closed_at,
          'classAtEntry', r.class_at_entry, 'eligibilityYears', r.eligibility_years,
          'isGradTransfer', r.is_grad_transfer,
          'origin', ${originText},
          'destination', ${destinationText},
          'events', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', e.id, 'type', e.type, 'occurredAt', e.occurred_at,
              'schoolId', e.school_id, 'schoolName', e.school_name,
              'superseded', ${supersededText}
            ) order by e.occurred_at, e.id)
            from public.recruitment_events e
            where e.recruitment_id = r.id and e.voided_at is null and e.type <> 'offered'
          ), '[]'::jsonb),
          'offers', coalesce((
            select jsonb_agg(jsonb_build_object(
              'eventId', e.id, 'occurredAt', e.occurred_at,
              'schoolId', e.school_id, 'schoolName', e.school_name
            ) order by e.occurred_at, e.id)
            from public.recruitment_events e
            where e.recruitment_id = r.id and e.voided_at is null and e.type = 'offered'
          ), '[]'::jsonb)
        ) order by r.entered_at desc, r.id desc)
        from public.recruitments r where r.player_sport_id = ps.id
      ), '[]'::jsonb)
    ) order by sp.slug)
    from public.player_sports ps
    join public.sports sp on sp.id = ps.sport_id
    where ps.player_id = p.id
  ), '[]'::jsonb)))`);

/** The batch this push covers, filled at the start of the transaction. */
const BATCH = "portal_push_players";
const inBatch = (column: string) =>
  sql.raw(`${column} in (select id from pg_temp.${BATCH})`);

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function sportCycleTags(
  tx: Tx,
  query: ReturnType<typeof sql>,
): Promise<string[]> {
  const rows = await tx.execute<{ slug: string; cycle_year: number }>(query);
  return rows.map((row) => portalWireTag(row.slug, Number(row.cycle_year)));
}

export interface PortalPushResult {
  pushId: number;
  playerCount: number;
  /** Cache tags to expire on the public site. */
  tags: string[];
}

/**
 * Publish every player with unpublished changes, in one transaction. Returns
 * null when nothing is pending. The caller expires `tags` afterwards and calls
 * `markPortalPushRevalidated`; anything left unmarked is retried by
 * `expirePendingPortalPushes`.
 */
export async function pushPortal({
  trigger,
  actorUserId = null,
}: {
  trigger: PortalPushTrigger;
  actorUserId?: string | null;
}): Promise<PortalPushResult | null> {
  return db.transaction(async (tx) => {
    // Waits for in-flight saves (they hold this lock shared), then keeps new
    // ones out until the push commits.
    await tx.execute(
      sql.raw(`set local lock_timeout = '${PUSH_LOCK_TIMEOUT}'`),
    );
    await tx.execute(
      sql`select pg_advisory_xact_lock(${PORTAL_PUSH_LOCK_SQL})`,
    );

    await tx.execute(
      sql.raw(
        `create temp table ${BATCH} (id bigint primary key) on commit drop`,
      ),
    );
    const [batch] = await tx.execute<{ count: number }>(sql`
      with added as (
        insert into pg_temp.${sql.raw(BATCH)} (id)
        select id from public.players where pending_since is not null
        returning id
      )
      select count(*)::int as count from added
    `);
    const playerCount = Number(batch?.count ?? 0);
    if (playerCount === 0) return null;

    const [push] = await tx
      .insert(portalPushesTable)
      .values({ actorUserId, trigger, playerCount })
      .returning({ id: portalPushesTable.id });
    if (!push) throw new Error("Push insert returned no row.");

    // Wire lists these players appeared on before, so a row that moved or
    // disappeared still expires the list it left.
    const tagsBefore = await sportCycleTags(
      tx,
      sql`
        select distinct sp.slug, w.cycle_year
        from public.published_wire_events w
        join public.sports sp on sp.id = w.sport_id
        where ${inBatch("w.player_id")}
      `,
    );
    await tx.execute(
      sql`delete from public.published_wire_events where ${inBatch("player_id")}`,
    );

    const tagsAfter = await sportCycleTags(
      tx,
      sql`
        with inserted as (
          insert into public.published_wire_events
            (event_id, recruitment_id, player_id, sport_id, kind, cycle_year,
             type, occurred_at, superseded, row, push_id)
          select e.id, r.id, p.id, ps.sport_id, r.kind, r.cycle_year,
                 e.type, e.occurred_at, s.superseded,
                 jsonb_strip_nulls(jsonb_build_object(
                   'v', 1, 'eventId', e.id, 'type', e.type,
                   'occurredAt', e.occurred_at, 'superseded', s.superseded,
                   'schoolId', e.school_id, 'schoolName', e.school_name,
                   'playerId', p.id, 'slug', p.slug,
                   'firstName', p.first_name, 'lastName', p.last_name,
                   'suffix', p.suffix,
                   'position', ps.position, 'heightIn', ps.height_in,
                   'weightLb', ps.weight_lb,
                   'classAtEntry', r.class_at_entry,
                   'isGradTransfer', r.is_grad_transfer,
                   'recruitmentId', r.id, 'status', r.status,
                   'origin', ${originSql}, 'destination', ${destinationSql})),
                 ${push.id}
          from public.recruitment_events e
          join public.recruitments r on r.id = e.recruitment_id
          join public.player_sports ps on ps.id = r.player_sport_id
          join public.players p on p.id = ps.player_id
          cross join lateral (select ${supersededSql} as superseded) s
          where ${inBatch("p.id")}
            and p.merged_into_id is null
            and p.hidden_at is null
            and e.voided_at is null
            and e.type <> 'offered'
          returning sport_id, cycle_year
        )
        select distinct sp.slug, i.cycle_year
        from inserted i join public.sports sp on sp.id = i.sport_id
      `,
    );

    // Hidden players leave the site entirely.
    await tx.execute(sql`
      delete from public.published_players pp
      using public.players p
      where pp.player_id = p.id and ${inBatch("p.id")} and p.hidden_at is not null
    `);

    await tx.execute(sql`
      insert into public.published_players
        (player_id, slug, indexable, redirect_to_player_id, doc, push_id, published_at)
      select p.id, p.slug,
             case when p.merged_into_id is null then ${indexableSql} else false end,
             p.merged_into_id,
             case when p.merged_into_id is null then ${playerDocSql}
                  else jsonb_build_object('v', 1, 'redirectToPlayerId', p.merged_into_id)
             end,
             ${push.id}, now()
      from public.players p
      where ${inBatch("p.id")} and p.hidden_at is null
      on conflict (player_id) do update set
        slug = excluded.slug,
        indexable = excluded.indexable,
        redirect_to_player_id = excluded.redirect_to_player_id,
        doc = excluded.doc,
        push_id = excluded.push_id,
        published_at = excluded.published_at
    `);

    await tx
      .update(playerAuditLogTable)
      .set({ pushId: push.id })
      .where(
        sql`${playerAuditLogTable.pushId} is null and ${inBatch(`"player_audit_log"."player_id"`)}`,
      );
    await tx
      .update(playersTable)
      .set({ pendingSince: null })
      .where(inBatch(`"players"."id"`));

    const playerIds = await tx.execute<{ id: number }>(
      sql.raw(`select id from pg_temp.${BATCH} order by id`),
    );
    const tags = [
      ...new Set([
        PLAYER_INDEX_TAG,
        ...tagsBefore,
        ...tagsAfter,
        ...playerIds.map((row) => playerTag(Number(row.id))),
      ]),
    ];
    await tx
      .update(portalPushesTable)
      .set({ tags })
      .where(eq(portalPushesTable.id, push.id));

    return { pushId: push.id, playerCount, tags };
  });
}

export async function markPortalPushRevalidated(pushId: number) {
  await db
    .update(portalPushesTable)
    .set({ revalidatedAt: sql`now()`, error: null })
    .where(eq(portalPushesTable.id, pushId));
}

export async function markPortalPushFailed(pushId: number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await db
    .update(portalPushesTable)
    .set({ error: message.slice(0, 1000) })
    .where(eq(portalPushesTable.id, pushId));
}

/**
 * Expire the cache tags of every push whose expiry hasn't been confirmed:
 * the push just made, or an earlier one whose expiry failed.
 */
export async function expirePendingPortalPushes(
  expire: (tags: string[]) => Promise<void> | void,
  { limit = 20 }: { limit?: number } = {},
) {
  const pushes = await db
    .select({ id: portalPushesTable.id, tags: portalPushesTable.tags })
    .from(portalPushesTable)
    .where(isNull(portalPushesTable.revalidatedAt))
    .orderBy(asc(portalPushesTable.committedAt))
    .limit(limit);
  const failed: Array<{ pushId: number; error: string }> = [];
  for (const push of pushes) {
    try {
      await expire(push.tags);
      await markPortalPushRevalidated(push.id);
    } catch (error) {
      await markPortalPushFailed(push.id, error);
      failed.push({
        pushId: push.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { expired: pushes.length - failed.length, failed };
}

/** For the admin bar: how many players and changes are waiting, and since when. */
export async function getPortalPendingSummary() {
  const [players] = await db
    .select({
      count: sql<number>`count(*)::int`,
      oldest: sql<Date | null>`min(${playersTable.pendingSince})`,
    })
    .from(playersTable)
    .where(isNotNull(playersTable.pendingSince));
  const [changes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playerAuditLogTable)
    .where(isNull(playerAuditLogTable.pushId));
  return {
    players: Number(players?.count ?? 0),
    changes: Number(changes?.count ?? 0),
    oldestPendingSince: players?.oldest ? new Date(players.oldest) : null,
  };
}
