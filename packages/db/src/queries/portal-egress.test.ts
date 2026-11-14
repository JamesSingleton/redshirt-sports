import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Supabase bills for bytes leaving the database. Player and portal queries
 * must name the columns they read: a whole-row `select()` or `returning()`
 * silently starts shipping every column added later (a headshot, a jsonb doc).
 */
const FILES = [
  "players.ts",
  "recruitments.ts",
  "portal-publish.ts",
  "portal-admin.ts",
  "player-duplicates.ts",
];

describe("portal queries name their columns", () => {
  it.each(FILES)("%s has no whole-row select or returning", (file) => {
    const source = readFileSync(
      fileURLToPath(new URL(file, import.meta.url)),
      "utf8",
    );
    const offenders = source
      .split("\n")
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => /\.(select|returning)\(\s*\)/.test(line))
      .map(({ line, number }) => `${file}:${number} ${line}`);
    expect(offenders).toEqual([]);
  });
});
