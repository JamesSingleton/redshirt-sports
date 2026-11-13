import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  assertSinceYear,
  DEFAULT_SINCE_SQL,
  scopedTables,
} from "../cli/sync-scope";
import { db } from "./fixtures";

const scoped = scopedTables(2026);
const scopedNames = scoped.map(({ table }) => table);

describe("db:sync-from-prod season scope", () => {
  it("names only tables that exist", async () => {
    const rows = await db.execute<{ tablename: string }>(
      sql`select tablename from pg_tables where schemaname = 'public'`,
    );
    const tables = new Set(rows.map((row) => row.tablename));
    expect(scopedNames.filter((name) => !tables.has(name))).toEqual([]);
  });

  it("has a valid filter for every scoped table", async () => {
    for (const { table, where } of scoped) {
      await expect(
        db.execute(
          sql.raw(`select count(*) from public."${table}" where ${where}`),
        ),
        table,
      ).resolves.toBeDefined();
    }
    await expect(db.execute(sql.raw(DEFAULT_SINCE_SQL))).resolves.toBeDefined();
  });

  // A new table that references games, ballots, ratings… must be scoped too,
  // or restoring foreign keys after a sync fails on rows that weren't copied.
  it("scopes every table that references a scoped table", async () => {
    const rows = await db.execute<{ from_table: string; to_table: string }>(sql`
      select c.conrelid::regclass::text as from_table,
             c.confrelid::regclass::text as to_table
      from pg_constraint c
      where c.contype = 'f'
        and c.connamespace = 'public'::regnamespace
        and c.confrelid::regclass::text in ${scopedNames}
    `);
    const unscoped = rows
      .filter((row) => !scopedNames.includes(row.from_table))
      .map((row) => `${row.from_table} -> ${row.to_table}`);
    expect(unscoped).toEqual([]);
  });

  it("only accepts a plain year", () => {
    expect(assertSinceYear("2026")).toBe(2026);
    for (const bad of ["2026; drop table seasons", "26", "20.26", "", "abcd"]) {
      expect(() => assertSinceYear(bad)).toThrow();
    }
  });
});
