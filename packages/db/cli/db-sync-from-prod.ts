/**
 * Rebuild the local database as a copy of production.
 *
 *   pnpm db:sync-from-prod [--yes] [--scrub-users] [--as-voter <prodUserId>=<localClerkUserId>]
 *                          [--from-dump <file>] [--dump-only] [--through <migration tag>]
 *
 * 1. Reads production read-only: which migrations it has, then a data-only pg_dump of `public`.
 * 2. Drops the local `public` and `drizzle` schemas and migrates them to exactly production's
 *    migration level, so the dump restores into the same shape it came from.
 * 3. Restores the data with foreign keys lifted, then puts them back (which re-validates them).
 * 4. Optionally scrubs non-voter users and re-keys one voter to your Clerk dev user.
 * 5. Compares row counts table by table and fails on any difference.
 *
 * Production is never written to. The target must be a database on this machine.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import {
  assertLocalDatabaseUrl,
  isLocalDatabaseUrl,
} from "../src/utils/local-database";
import { hasFlag, loadCliEnv, readFlag, repoRoot } from "./cli-env";

type Journal = {
  entries: Array<{ idx: number; when: number; tag: string }>;
};

const MIGRATIONS_DIR = path.join(repoRoot, "apps/web/supabase/migrations");
const DUMP_DIR = path.join(repoRoot, "apps/web/supabase/seed");

function log(message: string) {
  console.log(`• ${message}`);
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const result = spawnSync(command, args, {
    stdio: ["ignore", "inherit", "pipe"],
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (result.error) {
    throw new Error(`${command} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.status}):\n${result.stderr}`);
  }
  return result.stderr;
}

function readJournal(): Journal {
  return JSON.parse(
    readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8"),
  ) as Journal;
}

/**
 * Which repo migrations production has applied, as the last journal tag.
 * Production is migrated with the Supabase CLI, which records each file's
 * numeric prefix; its drizzle table is a stale leftover from an older history.
 * Either tracker counts only if it covers an unbroken run from 0000.
 */
async function sourceMigrationTag(
  source: postgres.Sql,
  journal: Journal,
): Promise<string> {
  const prefix = (applied: (entry: Journal["entries"][number]) => boolean) => {
    const run = [];
    for (const entry of journal.entries) {
      if (!applied(entry)) break;
      run.push(entry);
    }
    return run;
  };

  const supabaseRows = await source<{ version: string }[]>`
    select version from supabase_migrations.schema_migrations
  `.catch(() => [] as { version: string }[]);
  const versions = new Set(supabaseRows.map((row) => row.version));
  const bySupabase = prefix((entry) =>
    versions.has(entry.tag.split("_")[0] ?? ""),
  );
  if (bySupabase.length > 0) {
    return bySupabase[bySupabase.length - 1]!.tag;
  }

  const drizzleRows = await source<{ created_at: string }[]>`
    select created_at::text from drizzle.__drizzle_migrations
  `.catch(() => [] as { created_at: string }[]);
  const applied = new Set(drizzleRows.map((row) => Number(row.created_at)));
  const byDrizzle = prefix((entry) => applied.has(entry.when));
  if (byDrizzle.length > 0) {
    return byDrizzle[byDrizzle.length - 1]!.tag;
  }

  throw new Error(
    "Could not tell which migrations production has. Pass --through <tag>, e.g. --through 0023_playoff_bracket.",
  );
}

/** A copy of the migrations folder whose journal stops at `tag`. */
function migrationsThrough(journal: Journal, tag: string): string {
  const index = journal.entries.findIndex((entry) => entry.tag === tag);
  if (index < 0) {
    throw new Error(`Migration ${tag} is not in this repo's journal.`);
  }
  const folder = mkdtempSync(path.join(tmpdir(), "redshirt-migrations-"));
  cpSync(MIGRATIONS_DIR, folder, { recursive: true });
  writeFileSync(
    path.join(folder, "meta/_journal.json"),
    JSON.stringify(
      { ...journal, entries: journal.entries.slice(0, index + 1) },
      null,
      2,
    ),
  );
  return folder;
}

async function tableCounts(sql: postgres.Sql): Promise<Map<string, number>> {
  const tables = await sql<{ tablename: string }[]>`
    select tablename from pg_tables where schemaname = 'public' order by tablename
  `;
  const counts = new Map<string, number>();
  for (const { tablename } of tables) {
    const [row] = await sql<{ count: string }[]>`
      select count(*)::text as count from ${sql("public")}.${sql(tablename)}
    `;
    counts.set(tablename, Number(row?.count ?? 0));
  }
  return counts;
}

async function resetLocalSchema(target: postgres.Sql) {
  await target.unsafe(`
    drop schema if exists drizzle cascade;
    drop schema if exists public cascade;
    create schema public;
    grant usage on schema public to postgres, anon, authenticated, service_role;
    grant all on schema public to postgres, service_role;
  `);
}

type ForeignKey = { table: string; name: string; definition: string };

async function dropForeignKeys(target: postgres.Sql): Promise<ForeignKey[]> {
  const keys = await target<ForeignKey[]>`
    select c.conrelid::regclass::text as table,
           c.conname as name,
           pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'
  `;
  for (const key of keys) {
    await target.unsafe(
      `alter table ${key.table} drop constraint "${key.name}"`,
    );
  }
  return keys;
}

async function restoreForeignKeys(target: postgres.Sql, keys: ForeignKey[]) {
  for (const key of keys) {
    await target.unsafe(
      `alter table ${key.table} add constraint "${key.name}" ${key.definition}`,
    );
  }
}

/** Point every reference to one user at another id. */
async function rekeyUser(target: postgres.Sql, from: string, to: string) {
  const [existing] = await target`select 1 from users_table where id = ${from}`;
  if (!existing) {
    throw new Error(`--as-voter: no user ${from} in the copied data.`);
  }
  const columns = await target<{ table: string; column: string }[]>`
    select c.conrelid::regclass::text as table, a.attname as column
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.contype = 'f' and c.confrelid = 'public.users_table'::regclass
  `;
  await target.begin(async (tx) => {
    await tx`
      insert into users_table
      select ${to}, "firstName", "lastName", organization, "organizationRole", "isAdmin", "isVoter"
      from users_table where id = ${from}
    `;
    for (const { table, column } of columns) {
      await tx.unsafe(
        `update ${table} set "${column}" = $1 where "${column}" = $2`,
        [to, from],
      );
    }
    await tx`delete from users_table where id = ${from}`;
  });
}

async function confirm(question: string): Promise<boolean> {
  if (hasFlag("--yes")) {
    return true;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

/**
 * pg_dump needs a session, and Supabase's transaction pooler (6543) doesn't
 * give one. The same pooler host serves session mode on 5432.
 */
function sessionModeUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url;
  }
  const parsed = new URL(url);
  // Supabase adds client hints (`supa`, `pgbouncer`) that libpq tools reject.
  parsed.searchParams.delete("supa");
  parsed.searchParams.delete("pgbouncer");
  if (
    parsed.hostname.endsWith(".pooler.supabase.com") &&
    parsed.port === "6543"
  ) {
    parsed.port = "5432";
    log(
      "Using the Supabase session pooler (5432) instead of the transaction pooler (6543).",
    );
  }
  return parsed.toString();
}

async function main() {
  loadCliEnv();
  const sourceUrl = sessionModeUrl(
    readFlag("--source") ?? (process.env.PROD_DATABASE_URL || undefined),
  );
  const targetUrl = readFlag("--target") ?? process.env.DATABASE_URL;
  const fromDump = readFlag("--from-dump");
  const dumpOnly = hasFlag("--dump-only");
  const journal = readJournal();

  if (!fromDump && !sourceUrl) {
    throw new Error(
      "Set PROD_DATABASE_URL in apps/web/.env.local (Supabase session pooler or direct connection, port 5432), or pass --from-dump <file>.",
    );
  }
  if (!dumpOnly) {
    assertLocalDatabaseUrl(targetUrl);
  }
  if (sourceUrl && targetUrl && sourceUrl === targetUrl) {
    throw new Error("Source and target are the same database.");
  }

  // Every source session is read-only, at the server, before any statement runs.
  const readOnly = { connection: { default_transaction_read_only: true } };
  // Restoring a saved dump never touches production: there is nothing live to compare against.
  const source =
    sourceUrl && !fromDump
      ? postgres(sourceUrl, {
          max: 1,
          prepare: false,
          onnotice: () => {},
          ...readOnly,
        })
      : null;

  try {
    const throughTag =
      readFlag("--through") ??
      (source ? await sourceMigrationTag(source, journal) : null);
    if (!throughTag) {
      throw new Error("With --from-dump, also pass --through <migration tag>.");
    }
    log(`Source is at migration ${throughTag}.`);

    let dumpFile = fromDump;
    if (!dumpFile) {
      mkdirSync(DUMP_DIR, { recursive: true });
      const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      dumpFile = path.join(DUMP_DIR, `prod-${stamp}.dump`);
      log(
        `Dumping production data (read-only) to ${path.relative(repoRoot, dumpFile)}…`,
      );
      run(
        "pg_dump",
        [
          "--data-only",
          "--format=custom",
          "--schema=public",
          "--no-owner",
          "--no-privileges",
          `--file=${dumpFile}`,
          sourceUrl!,
        ],
        { PGOPTIONS: "-c default_transaction_read_only=on" },
      );
    } else if (!existsSync(dumpFile)) {
      throw new Error(`Dump file ${dumpFile} does not exist.`);
    }
    if (dumpOnly) {
      log("Dump written. Skipping restore (--dump-only).");
      return;
    }

    const targetName = new URL(targetUrl!).pathname.slice(1);
    if (
      !(await confirm(
        `This deletes every table in the local "${targetName}" database and replaces it with production data. Continue?`,
      ))
    ) {
      log("Cancelled.");
      return;
    }

    const target = postgres(targetUrl!, { max: 1, onnotice: () => {} });
    try {
      log("Resetting local public and drizzle schemas…");
      await resetLocalSchema(target);

      log(`Migrating local database through ${throughTag}…`);
      const folder = migrationsThrough(journal, throughTag);
      try {
        await migrate(drizzle(target), { migrationsFolder: folder });
      } finally {
        rmSync(folder, { recursive: true, force: true });
      }

      log("Restoring data…");
      const keys = await dropForeignKeys(target);
      run("pg_restore", [
        "--data-only",
        "--no-owner",
        "--no-privileges",
        "--exit-on-error",
        "--single-transaction",
        `--dbname=${targetUrl}`,
        dumpFile,
      ]);
      await restoreForeignKeys(target, keys);
      log(`Restored and re-validated ${keys.length} foreign keys.`);

      if (source) {
        // Keep `supabase migration list` in step with production.
        const tracked = await source<
          { version: string; name: string | null }[]
        >`
          select version, name from supabase_migrations.schema_migrations
        `.catch(() => []);
        if (tracked.length > 0) {
          await target.begin(async (tx) => {
            await tx`create schema if not exists supabase_migrations`;
            await tx`
              create table if not exists supabase_migrations.schema_migrations
                (version text primary key, statements text[], name text)
            `;
            await tx`delete from supabase_migrations.schema_migrations`;
            await tx`
              insert into supabase_migrations.schema_migrations ${tx(tracked, "version", "name")}
            `;
          });
          log(`Copied ${tracked.length} Supabase migration records.`);
        }
      }

      if (hasFlag("--scrub-users")) {
        const scrubbed = await target`
          update users_table
          set "firstName" = 'User',
              "lastName" = right(id, 6),
              organization = null,
              "organizationRole" = null
          where not "isVoter" and not "isAdmin"
        `;
        log(`Scrubbed ${scrubbed.count} non-voter users.`);
      }

      const asVoter = readFlag("--as-voter");
      if (asVoter) {
        const [from, to] = asVoter.split("=");
        if (!from || !to) {
          throw new Error("--as-voter takes <prodUserId>=<localClerkUserId>.");
        }
        await rekeyUser(target, from, to);
        log(`Re-keyed ${from} to ${to}.`);
      }

      if (source) {
        log("Comparing row counts…");
        const [expected, actual] = await Promise.all([
          tableCounts(source),
          tableCounts(target),
        ]);
        const mismatches = [...expected].filter(
          ([table, count]) => actual.get(table) !== count,
        );
        for (const [table, count] of expected) {
          console.log(
            `  ${table.padEnd(36)} ${String(count).padStart(8)}  ${actual.get(table) === count ? "ok" : `local ${actual.get(table) ?? "missing"}`}`,
          );
        }
        if (mismatches.length > 0) {
          throw new Error(
            `${mismatches.length} tables differ from production.`,
          );
        }
      }
      log(`Done. Local database matches production at ${throughTag}.`);
      log(
        "Run `pnpm --filter web db:migrate` to apply newer migrations on top.",
      );
    } finally {
      await target.end();
    }
  } finally {
    await source?.end();
  }
}

if (process.env.DATABASE_URL && !isLocalDatabaseUrl(process.env.DATABASE_URL)) {
  console.warn(
    "DATABASE_URL is not local; the restore step will refuse to run.",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
