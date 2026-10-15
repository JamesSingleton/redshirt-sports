import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { bracketEventsTable, schoolsTable } from "./schema";

const migrationsDir = resolve(
  import.meta.dirname,
  "../../../apps/web/supabase/migrations",
);

function readMigration(name: string) {
  return readFileSync(resolve(migrationsDir, name), "utf8");
}

describe("milestone 1 schema", () => {
  it("names the bracket column division", () => {
    const columns = getTableColumns(bracketEventsTable);
    expect(columns.division).toBeDefined();
    expect("browseScope" in columns).toBe(false);
  });

  it("does not add a slug lock on schools", () => {
    const columns = getTableColumns(schoolsTable);
    expect(columns.slug).toBeDefined();
    const sql = readMigration("0023_milestone_1_core.sql");
    expect(sql.toLowerCase()).not.toContain("slug lock");
    expect(sql).not.toMatch(/create\s+trigger/i);
  });

  it("adds deletedAt without renaming existing user columns", () => {
    const sql = readMigration("0023_milestone_1_core.sql");
    expect(sql).toContain('ADD COLUMN "deletedAt"');
    expect(sql).not.toMatch(/alter table .+ rename/i);
  });
});

describe("milestone 1 rls migration", () => {
  const sql = readMigration("0024_lock_down_milestone_1.sql");

  it("enables rls and revokes access without policies or grants", () => {
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON TABLE");
    expect(sql).not.toMatch(/create policy/i);
    expect(sql).not.toMatch(/\bgrant\b/i);
  });
});

describe("milestone 1 withRls", () => {
  it("sets the local role from a literal, not from caller input", () => {
    const source = readFileSync(
      resolve(import.meta.dirname, "client.ts"),
      "utf8",
    );
    expect(source).toContain('const role = claims ? "authenticated" : "anon"');
    expect(source).toContain("export const adminDb = primaryDb");
    expect(source).not.toMatch(/create policy/i);
  });
});

describe("milestone 1 seed", () => {
  it("uses fake Example State data", () => {
    const seed = readFileSync(
      resolve(import.meta.dirname, "../../../apps/web/supabase/seed.sql"),
      "utf8",
    );
    expect(seed).toContain("Example State");
    expect(seed).toContain("example-voter-1");
    expect(seed).toContain("'fcs'");
    expect(seed.toLowerCase()).not.toContain("browse scope");
  });
});
