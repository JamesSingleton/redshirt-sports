import { keys as analytics } from "@redshirt-sports/analytics/keys";
import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { keys as observability } from "@redshirt-sports/observability/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), observability(), analytics(), auth()],
  server: {
    POSTGRES_URL: z.url(),
    POSTGRES_URL_NON_POOLING: z.url(),
  },
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
  },
});
