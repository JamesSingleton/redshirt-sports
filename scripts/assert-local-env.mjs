#!/usr/bin/env node
// Refuses to continue unless the environment points at LOCAL / development services only.
// Usage: node scripts/assert-local-env.mjs [path/to/.env.local ...]
// Default env files: apps/web/.env.local, apps/admin/.env.local, apps/studio/.env.local (if present).
// Exit code 1 on any violation. No dependencies.
import { existsSync, readFileSync } from "node:fs";

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["apps/web/.env.local", "apps/admin/.env.local", "apps/studio/.env.local"];

function parse(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const sources = [["process.env", process.env]];
for (const f of files) if (existsSync(f)) sources.push([f, parse(f)]);

const errors = [];
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "host.docker.internal"]);
const DB_VARS = ["DATABASE_URL", "DATABASE_URL_DIRECT", "DATABASE_URL_SESSION", "LOCAL_DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL"];
const URL_VARS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SCHOOL_SYNC_URL", "UPSTASH_REDIS_REST_URL"];
const DATASET_VARS = ["SANITY_API_DATASET", "SANITY_STUDIO_DATASET", "NEXT_PUBLIC_SANITY_DATASET"];
const FORBIDDEN_NONEMPTY = ["PROD_DATABASE_URL", "VERCEL_TOKEN", "SUPABASE_ACCESS_TOKEN", "NEON_API_KEY", "SANITY_AUTH_TOKEN"];

for (const [src, env] of sources) {
  for (const k of DB_VARS) {
    const v = env[k];
    if (!v) continue;
    try {
      const u = new URL(v);
      if (!LOCAL_HOSTS.has(u.hostname)) errors.push(`${src}: ${k} points at ${u.hostname} (must be 127.0.0.1/localhost)`);
      else if (!["54322", "54329"].includes(u.port)) errors.push(`${src}: ${k} uses port ${u.port || "(default)"}; local Supabase Postgres is 54322 (pooler 54329)`);
    } catch { errors.push(`${src}: ${k} is not a valid URL`); }
  }
  for (const k of URL_VARS) {
    const v = env[k];
    if (!v) continue;
    try {
      const u = new URL(v.startsWith("http") ? v : `https://${v}`);
      if (!LOCAL_HOSTS.has(u.hostname)) errors.push(`${src}: ${k} points at ${u.hostname} (must be local)`);
    } catch { errors.push(`${src}: ${k} is not a valid URL`); }
  }
  for (const k of DATASET_VARS) {
    if (env[k] && env[k].trim().toLowerCase() === "production") errors.push(`${src}: ${k}=production (use "development")`);
  }
  for (const k of ["CLERK_SECRET_KEY"]) if (env[k] && !env[k].startsWith("sk_test_")) errors.push(`${src}: ${k} is not a Clerk development key (sk_test_…)`);
  for (const k of ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]) if (env[k] && !env[k].startsWith("pk_test_")) errors.push(`${src}: ${k} is not a Clerk development key (pk_test_…)`);
  for (const k of FORBIDDEN_NONEMPTY) if (env[k]) errors.push(`${src}: ${k} must be empty in a local/Cursor session`);
  if (env.VERCEL_ENV === "production" || env.VERCEL === "1") errors.push(`${src}: VERCEL/VERCEL_ENV set; this looks like a pulled Vercel env`);
  if (env.EMAIL_TRANSPORT && !["preview", "resend-test"].includes(env.EMAIL_TRANSPORT)) errors.push(`${src}: EMAIL_TRANSPORT must be "preview" or "resend-test"`);
}

if (errors.length) {
  console.error("✗ Not a local-only environment:\n  - " + errors.join("\n  - "));
  console.error("See docs/blueprint/LOCAL_DEVELOPMENT.md. Refusing to continue.");
  process.exit(1);
}
console.log(`✓ Local-only environment (checked: ${sources.map(([s]) => s).join(", ")})`);
