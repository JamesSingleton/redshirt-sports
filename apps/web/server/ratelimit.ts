import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/env";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "100 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

/** Public rankings ingest API — 60 requests per minute per IP. */
export const rankingsApiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/rankings-api",
});

/** Public transfer portal JSON: 60 requests per minute per IP, on CDN misses only. */
export const portalApiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/portal-api",
});

/**
 * The public "report a move" form: 5 submissions an hour per IP and per
 * email. BotID and a honeypot sit in front of it; this caps a real person
 * (or a patient script) flooding the inbox.
 */
export const portalSubmissionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/portal-submission",
});

/**
 * Newsletter signups: 5 an hour per IP and per address. Each one sends a
 * confirm email, so this keeps the form from being used to spam an inbox.
 */
export const newsletterSignupRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/newsletter-signup",
});
