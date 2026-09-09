import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as db } from "@redshirt-sports/db/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { keys as observability } from "@redshirt-sports/observability/keys";
import { keys as sanity } from "@redshirt-sports/sanity/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), auth(), db(), observability(), sanity()],
  server: {
    /** Shared with web `/api/revalidate-tags` to bust public rankings caches. */
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
  },
});
