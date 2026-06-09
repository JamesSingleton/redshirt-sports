import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      POSTGRES_URL: z.url(),
    },
    runtimeEnv: {
      POSTGRES_URL: process.env.POSTGRES_URL,
    },
  });
