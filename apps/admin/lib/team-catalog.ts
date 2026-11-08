import { loadTeamCatalog } from "@redshirt-sports/db/ratings";
import { cacheLife } from "next/cache";

/**
 * The provider's team lists: every football division plus Division I basketball,
 * three requests. Lower-division basketball needs the CLI (`pnpm team-ids --full`).
 */
export async function teamCatalog() {
  "use cache";
  cacheLife("hours");
  return loadTeamCatalog();
}
