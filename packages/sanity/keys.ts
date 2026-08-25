import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      SANITY_API_READ_TOKEN: z.string().min(1),
      SANITY_REVALIDATE_SECRET: z.string().min(1),
    },
    client: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
      NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).default("production"),
      NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1).default("2026-06-12"),
      NEXT_PUBLIC_SANITY_STUDIO_URL: z.url().optional(),
    },
    runtimeEnv: {
      SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
      SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
      NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
      NEXT_PUBLIC_SANITY_API_VERSION:
        process.env.NEXT_PUBLIC_SANITY_API_VERSION,
      NEXT_PUBLIC_SANITY_STUDIO_URL: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
    },
  });
