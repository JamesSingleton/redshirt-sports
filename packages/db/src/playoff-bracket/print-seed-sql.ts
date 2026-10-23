import { BRACKET_DIVISION_SEEDS, BRACKET_FORMAT_SEEDS } from "./spec";

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

const statements: string[] = [];

for (const division of BRACKET_DIVISION_SEEDS) {
  statements.push(`INSERT INTO "bracket_divisions" ("id", "sport_id", "slug", "label")
SELECT gen_random_uuid()::text, "id", ${sqlString(division.slug)}, ${sqlString(division.label)}
FROM "sports"
WHERE "slug" = ${sqlString(division.sportSlug)}
AND NOT EXISTS (
  SELECT 1 FROM "bracket_divisions" "existing"
  JOIN "sports" "existing_sport" ON "existing_sport"."id" = "existing"."sport_id"
  WHERE "existing_sport"."slug" = ${sqlString(division.sportSlug)}
    AND "existing"."slug" = ${sqlString(division.slug)}
)`);
}

for (const format of BRACKET_FORMAT_SEEDS) {
  const json = JSON.stringify(format.spec);
  if (json.includes("$spec$")) {
    throw new Error(`spec for ${format.key} contains the dollar-quote tag`);
  }
  const toYear =
    format.effectiveToYear === null ? "NULL" : String(format.effectiveToYear);
  const divisionJoin = format.divisionSlug
    ? `JOIN "bracket_divisions" "division" ON "division"."sport_id" = "sport"."id" AND "division"."slug" = ${sqlString(format.divisionSlug)}`
    : "";
  const divisionId = format.divisionSlug ? '"division"."id"' : "NULL";
  statements.push(`INSERT INTO "bracket_formats" ("id", "sport_id", "division_id", "key", "effective_from_year", "effective_to_year", "spec")
SELECT gen_random_uuid()::text, "sport"."id", ${divisionId}, ${sqlString(format.key)}, ${format.effectiveFromYear}, ${toYear}, $spec$${json}$spec$::jsonb
FROM "sports" "sport"
${divisionJoin}
WHERE "sport"."slug" = ${sqlString(format.sportSlug)}
AND NOT EXISTS (
  SELECT 1 FROM "bracket_formats" "existing" WHERE "existing"."key" = ${sqlString(format.key)}
)`);
}

statements.push(
  `ALTER TABLE "bracket_divisions" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_formats" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_editions" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_slots" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_games" ENABLE ROW LEVEL SECURITY`,
);

process.stdout.write(`${statements.join(";\n--> statement-breakpoint\n")};\n`);
