import { BRACKET_FORMAT_SEEDS } from "./spec";

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

const statements: string[] = [];

for (const format of BRACKET_FORMAT_SEEDS) {
  const json = JSON.stringify(format.spec);
  if (json.includes("$spec$")) {
    throw new Error(`spec for ${format.key} contains the dollar-quote tag`);
  }
  const toYear =
    format.effectiveToYear === null ? "NULL" : String(format.effectiveToYear);
  const divisionSlug = format.divisionSlug
    ? sqlString(format.divisionSlug)
    : "NULL";
  statements.push(`INSERT INTO "bracket_formats" ("id", "sport_id", "division_slug", "key", "effective_from_year", "effective_to_year", "spec")
SELECT gen_random_uuid()::text, "sport"."id", ${divisionSlug}, ${sqlString(format.key)}, ${format.effectiveFromYear}, ${toYear}, $spec$${json}$spec$::jsonb
FROM "sports" "sport"
WHERE "sport"."slug" = ${sqlString(format.sportSlug)}
AND NOT EXISTS (
  SELECT 1 FROM "bracket_formats" "existing" WHERE "existing"."key" = ${sqlString(format.key)}
)`);
}

statements.push(
  `ALTER TABLE "bracket_formats" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_editions" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_slots" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "bracket_games" ENABLE ROW LEVEL SECURITY`,
);

process.stdout.write(`${statements.join(";\n--> statement-breakpoint\n")};\n`);
