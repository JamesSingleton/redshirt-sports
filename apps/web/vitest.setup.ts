import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project-id";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "production";
process.env.SANITY_API_READ_TOKEN ??= "test-token";
process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??= "redshirtsports.com";
process.env.NEXT_PUBLIC_SITE_URL ??= "redshirtsports.com";
process.env.UPSTASH_REDIS_REST_TOKEN ??= "test-upstash-token";
process.env.UPSTASH_REDIS_REST_URL ??= "https://test.upstash.io";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.NEXT_PUBLIC_POSTHOG_KEY ??= "test-posthog-key";
process.env.NEXT_PUBLIC_POSTHOG_HOST ??= "https://app.posthog.com";
