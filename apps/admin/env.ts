import { keys as core } from "@redshirt-sports/next-config/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  extends: [core()],
  server: {},
  client: {},
  runtimeEnv: {},
});
