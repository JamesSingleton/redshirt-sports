import { keys as analytics } from "@redshirt-sports/analytics/keys";
import { keys as auth } from "@redshirt-sports/auth/keys";
import { keys as db } from "@redshirt-sports/db/keys";
import { keys as core } from "@redshirt-sports/next-config/keys";
import { keys as observability } from "@redshirt-sports/observability/keys";
import { keys as sanity } from "@redshirt-sports/sanity/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [core(), observability(), analytics(), auth(), db(), sanity()],
  server: {
    CLERK_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
    SANITY_REVALIDATE_SECRET: z.string().min(1),
    CACHE_REVALIDATE_SECRET: z.string().min(1),
    SCHOOL_SYNC_SECRET: z.string().min(1),
    /** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. The ratings cron refuses to run without it. */
    CRON_SECRET: z.string().min(16).optional(),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    RESEND_NEWSLETTER_AUDIENCE_ID: z.string().min(1).optional(),
    NEWSLETTER_FROM_EMAIL: z.string().email().optional(),
    NEWSLETTER_SIGNING_SECRET: z.string().min(32).optional(),
  },
  client: {},
  runtimeEnv: {
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
    CACHE_REVALIDATE_SECRET: process.env.CACHE_REVALIDATE_SECRET,
    SCHOOL_SYNC_SECRET: process.env.SCHOOL_SYNC_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_NEWSLETTER_AUDIENCE_ID: process.env.RESEND_NEWSLETTER_AUDIENCE_ID,
    NEWSLETTER_FROM_EMAIL: process.env.NEWSLETTER_FROM_EMAIL,
    NEWSLETTER_SIGNING_SECRET: process.env.NEWSLETTER_SIGNING_SECRET,
  },
});
