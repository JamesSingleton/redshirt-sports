import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Architecture rule: player profiles, rosters, recruiting data, and game
 * records live with the sports data providers and Postgres, never in Sanity.
 * Articles point at them by provider id (`gameRef`, `playerRef`).
 *
 * Reads the extracted schema (`pnpm type` regenerates it), so it checks what
 * Studio actually deploys.
 */
type SchemaType = {
  name: string;
  type: string;
  attributes?: Record<string, unknown>;
};

const dir = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  readFileSync(path.resolve(dir, "../../schema.json"), "utf8"),
) as SchemaType[];

const FORBIDDEN_DOCUMENT = /player|athlete|roster|recruit|prospect|game|match/i;
const FORBIDDEN_FIELD =
  /^(height|weight|hometown|jersey(Number)?|position|classYear|eligibility|starRating|commitment|stats)$/i;

describe("no player or game data in Sanity", () => {
  it("has no document type for players, rosters, recruits, or games", () => {
    const offenders = schema
      .filter((type) => type.type === "document")
      .map((type) => type.name)
      .filter((name) => FORBIDDEN_DOCUMENT.test(name));
    expect(offenders).toEqual([]);
  });

  it("has no player-profile fields on any type", () => {
    const offenders = schema.flatMap((type) =>
      Object.keys(type.attributes ?? {})
        .filter((field) => FORBIDDEN_FIELD.test(field))
        .map((field) => `${type.name}.${field}`),
    );
    expect(offenders).toEqual([]);
  });

  it("references games and players by provider id only", () => {
    const byName = new Map(schema.map((type) => [type.name, type]));
    for (const name of ["gameRef", "playerRef"]) {
      expect(byName.get(name)?.type, name).toBe("type");
    }
  });
});
