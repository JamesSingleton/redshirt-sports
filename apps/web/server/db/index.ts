import { primaryDb } from "@redshirt-sports/db/client";

/**
 * Shared Drizzle client for route handlers.
 * Prefer `@redshirt-sports/db/queries` for reusable reads; use this for writes
 * that need the same pooled connection as the rest of the app.
 */
export const db = primaryDb;
