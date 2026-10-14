import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), auth()],
  server: {},
  client: {},
  runtimeEnv: {},
});
