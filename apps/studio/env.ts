import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Studio is a Vite browser app. Use `@t3-oss/env-core` (not `env-nextjs`) with
 * `clientPrefix: "SANITY_STUDIO_"` so config is readable in the browser.
 */
export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  clientPrefix: "SANITY_STUDIO_",
  client: {
    SANITY_STUDIO_PROJECT_ID: z.string().min(1),
    SANITY_STUDIO_DATASET: z.string().min(1).default("production"),
    SANITY_STUDIO_TITLE: z.string().min(1).default("Redshirt Sports Studio"),
    SANITY_STUDIO_PRESENTATION_URL: z.url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
    SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
    SANITY_STUDIO_TITLE: process.env.SANITY_STUDIO_TITLE,
    SANITY_STUDIO_PRESENTATION_URL: process.env.SANITY_STUDIO_PRESENTATION_URL,
  },
});
