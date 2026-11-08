/**
 * pnpm team-ids [--full] [--apply] [--out <file.json>] [--allow-remote]
 *
 * Match every school without a provider team id against the provider's college team lists.
 *
 *   --full     Also walk each league's season team lists for lower-division basketball
 *              teams (about a thousand extra requests). Without it: three requests.
 *   --apply    Save the confident matches. Without it nothing is written.
 *   --out      Write the plan (confident matches and the review list) as JSON.
 *   --catalog  Read the team catalog from this JSON file if it exists, else fetch and save it there.
 *
 * Existing mappings are never changed. The rest are listed for review on the admin
 * School IDs page. Writes go to DATABASE_URL; anything but a local database needs
 * --allow-remote.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { assertLocalDatabaseUrl } from "../src/utils/local-database";
import { hasFlag, loadCliEnv, readFlag } from "./cli-env";

loadCliEnv();
if (!hasFlag("--allow-remote")) {
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
}

const ratings = await import("../src/ratings");
const log = (line: string) => console.log(`• ${line}`);

const catalogFile = readFlag("--catalog");
let catalog: Awaited<ReturnType<typeof ratings.loadTeamCatalog>>;
if (catalogFile && existsSync(catalogFile)) {
  catalog = JSON.parse(readFileSync(catalogFile, "utf8"));
  log(`Read the catalog from ${catalogFile}.`);
} else {
  catalog = await ratings.loadTeamCatalog({ full: hasFlag("--full"), log });
  if (catalogFile) writeFileSync(catalogFile, JSON.stringify(catalog));
}
log(`${catalog.length} provider teams in the catalog.`);

const plan = await ratings.planUnmappedSchools(catalog);
log(
  `${plan.schools} schools, ${plan.mappedBefore} already mapped, ${plan.accepted.length} confident matches, ${plan.review.length} to review.`,
);

const reasons = new Map<string, number>();
for (const item of plan.review) {
  reasons.set(item.reason, (reasons.get(item.reason) ?? 0) + 1);
}
for (const [reason, total] of reasons) log(`  ${reason}: ${total}`);

const out = readFlag("--out");
if (out) {
  writeFileSync(out, `${JSON.stringify(plan, null, 2)}\n`);
  log(`Plan written to ${out}.`);
}

if (hasFlag("--apply")) {
  const { inserted, skipped } = await ratings.applyTeamIdMappings(
    plan.accepted,
  );
  log(`Saved ${inserted.length} mapping(s).`);
  for (const mapping of skipped) {
    log(
      `  Skipped ${mapping.schoolName} → ${mapping.teamName} (${mapping.externalId}): mapped since the plan was made.`,
    );
  }
  const after = await ratings.teamIdCoverage();
  log(`Coverage: ${after.mapped} of ${after.schools} schools have a team id.`);
} else {
  for (const mapping of plan.accepted.slice(0, 15)) {
    log(
      `  ${mapping.schoolName} → ${mapping.teamName} (${mapping.externalId})`,
    );
  }
  if (plan.accepted.length > 15)
    log(`  …and ${plan.accepted.length - 15} more.`);
  log("Dry run. Pass --apply to save the confident matches.");
}
process.exit(0);
