import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { keys } from "../keys";
import * as schema from "./schema";

/**
 * Serverless-safe postgres.js settings.
 * Short connect/idle timeouts avoid burning Vercel's ~10s function budget on
 * stale TCP sockets after an isolate freeze (Supabase CONNECT_TIMEOUT hangs).
 *
 * max_lifetime is disabled: postgres.js terminates aged sockets via a timer,
 * which races in-flight queries in long-lived Next.js processes and surfaces
 * as CONNECTION_DESTROYED. Stale sockets are handled by idle_timeout +
 * {@link ensurePrimaryDbAlive} at request boundaries.
 */
export const serverlessPostgresOptions = {
  prepare: false,
  max: 2,
  idle_timeout: 20,
  max_lifetime: 0,
  connect_timeout: 3,
} as const;

const LIVENESS_TIMEOUT_MS = 2_000;

type PrimarySchema = typeof schema;
type PrimaryDb = PostgresJsDatabase<PrimarySchema>;

let primarySql: Sql | null = null;
let primaryDbInstance: PrimaryDb | null = null;
let ensureAliveInFlight: Promise<void> | null = null;

function warnIfDirectSupabaseHost(databaseUrl: string) {
  try {
    const { hostname, port } = new URL(databaseUrl);
    const isDirect =
      hostname.startsWith("db.") && hostname.endsWith(".supabase.co");
    const isPooler = hostname.includes("pooler.supabase.com");
    if (isDirect || (isPooler && port === "5432")) {
      console.warn(
        "[db] DATABASE_URL looks like a direct/session Supabase host. " +
          "On Vercel, use the transaction pooler (*.pooler.supabase.com:6543) " +
          "to avoid CONNECT_TIMEOUT / 10s function hangs.",
      );
    }
  } catch {
    // Invalid URL is validated elsewhere via env schema.
  }
}

function createPrimarySql() {
  const databaseUrl = keys().DATABASE_URL;
  warnIfDirectSupabaseHost(databaseUrl);
  return postgres(databaseUrl, serverlessPostgresOptions);
}

function createPrimaryDb(sql: Sql): PrimaryDb {
  return drizzle(sql, {
    schema,
    casing: "snake_case",
  });
}

function getPrimarySql() {
  if (!primarySql) {
    primarySql = createPrimarySql();
  }
  return primarySql;
}

function getPrimaryDbInstance() {
  if (!primaryDbInstance) {
    primaryDbInstance = createPrimaryDb(getPrimarySql());
  }
  return primaryDbInstance;
}

async function endPrimarySql() {
  const sql = primarySql;
  primarySql = null;
  primaryDbInstance = null;
  if (!sql) return;
  try {
    await sql.end({ timeout: 1 });
  } catch {
    // Pool may already be dead; ignore teardown errors.
  }
}

/**
 * Drop the cached postgres.js client so the next query opens a fresh socket.
 * Use after CONNECT_TIMEOUT / hung liveness checks on serverless.
 */
export async function recyclePrimaryClient() {
  await endPrimarySql();
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

/**
 * Ping the pool and recycle once if the socket is stale/unreachable.
 *
 * Call once at the start of a request handler, before parallel queries.
 * Do not call from query helpers that may run concurrently — a timed-out
 * ping under a saturated pool (max: 2) would recycle sockets still in use
 * and cause CONNECTION_DESTROYED on sibling queries.
 */
export async function ensurePrimaryDbAlive() {
  if (ensureAliveInFlight) return ensureAliveInFlight;

  ensureAliveInFlight = (async () => {
    const ping = async () => {
      const sql = getPrimarySql();
      await withTimeout(sql`select 1`, LIVENESS_TIMEOUT_MS, "DB liveness");
    };

    try {
      await ping();
    } catch {
      await recyclePrimaryClient();
      await ping();
    }
  })().finally(() => {
    ensureAliveInFlight = null;
  });

  return ensureAliveInFlight;
}

/**
 * Drizzle client that always points at the current (possibly recycled) pool.
 * Existing `import { primaryDb }` call sites keep working after recycle.
 */
export const primaryDb: PrimaryDb = new Proxy({} as PrimaryDb, {
  get(_target, property, receiver) {
    const db = getPrimaryDbInstance();
    const value = Reflect.get(db, property, receiver);
    return typeof value === "function" ? value.bind(db) : value;
  },
});
