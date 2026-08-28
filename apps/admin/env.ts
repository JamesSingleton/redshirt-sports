import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as db } from "@redshirt-sports/db/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { keys as observability } from "@redshirt-sports/observability/keys";
import { keys as sanity } from "@redshirt-sports/sanity/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), auth(), db(), observability(), sanity()],
  server: {},
  client: {},
  runtimeEnv: {},
});
