import "server-only";

import {
  getSportIdBySlug as getSportIdBySlugUncached,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { cache } from "react";

/** Per-request dedup for sport ID lookups used in metadata + page/API handlers. */
export const getCachedSportIdBySlug = cache(
  async (slug: SportParam): Promise<string | null> => {
    return getSportIdBySlugUncached(slug);
  },
);

export type { SportParam };
