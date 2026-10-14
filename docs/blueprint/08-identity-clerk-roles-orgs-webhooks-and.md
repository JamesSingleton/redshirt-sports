## 8. Identity: Clerk, roles, orgs, webhooks and Supabase third-party auth

### 8.1 Role model

| Role | Granted by | Can do |
|---|---|---|
| `reader` (implicit) | Sign-up | Comment (later), create bracket entries, join groups, follow teams, manage newsletter prefs |
| `subscriber` | Billing entitlement | Read premium content, ad-light experience |
| `voter` | Accepting an admin-issued invite for a specific poll and season (no public applications) | Submit ballots for the polls and seasons they hold an active `voters` row for |
| `contributor` | Admin | Write drafts in Sanity (Sanity role), no publish |
| `editor` | Admin | Publish in Sanity; feature content; moderate |
| `poll_admin` | Admin | Open/close poll weeks, approve voters, void ballots, publish results |
| `bracket_admin` | Admin | Create bracket events, set field/seeds, enter results, rescore |
| `data_admin` | Admin | Manage schools/teams/conference memberships, legacy redirects, enter bracket results (with `bracket_admin`) |
| `admin` | Owner | Everything, including role grants |

**Where roles live:** Clerk `publicMetadata.roles: string[]` is the source of truth for staff roles and is copied into the session token so middleware and RLS can read it without a DB call. Voter membership is per poll and season and lives in Postgres (`voters`); accepting an invite also adds `voter` to `publicMetadata.roles` (plus `isVoter`) as a coarse gate, mirrored into `user_roles` by the webhook (§13.4).

**Clerk Organizations** are optional but useful for two things: (1) a "Redshirt Staff" org whose org roles map to staff permissions, and (2) future **sponsored or partner groups** (a media partner org that owns a sponsored bracket group). Bracket groups themselves do *not* need to be Clerk orgs; they are plain Postgres rows, which scales better and avoids per-org pricing.

### 8.2 Session token claims

In the Clerk dashboard, customize the session token:

```json
{
  "role": "authenticated",
  "roles": "{{user.public_metadata.roles}}",
  "is_voter": "{{user.public_metadata.isVoter}}",
  "plan": "{{user.public_metadata.plan}}"
}
```

The `role: "authenticated"` claim is what Supabase needs to map the request to the `authenticated` Postgres role. Clerk's native Supabase integration adds it for you; if you enable that integration, keep the custom claims small (session tokens should stay well under the cookie size limit).

### 8.3 Supabase third-party auth with Clerk, and how Drizzle uses it

1. In Clerk, enable the Supabase integration (it sets up the claims Supabase expects).
2. In Supabase: Authentication → Third-party auth → add Clerk with your Clerk domain. Supabase then trusts Clerk-signed JWTs for supabase-js, Realtime and Storage requests.
3. In Postgres, `auth.jwt() ->> 'sub'` is the **Clerk user id** (e.g. `user_2abc…`). All user-owned tables use `text` user ids, not `uuid`, and never reference `auth.users`.

**Data access is Drizzle ORM** (`packages/db`, §10.10–10.16). Server code never queries through supabase-js. There are three access paths:

| Path | Client | RLS | Used for |
|---|---|---|---|
| **Trusted server** | `adminDb` (Drizzle over Supavisor, dedicated `rs_server` role with `BYPASSRLS`) | Bypassed. Authorization is done in code: `auth()` from Clerk, then explicit `userId` filters, domain checks and DB constraints | Writes (ballots, picks, invites, audit), cached public reads, jobs, webhooks, workers |
| **RLS-scoped server** | `withRls(claims, tx => …)`: Drizzle transaction that runs `set local role authenticated` and sets `request.jwt.claims` from the **verified** Clerk session | Applies, same policies as the browser | Reads of private, user-owned data (my entries, my ballots, private group pages) where a missing `where` clause must not leak data |
| **Browser** | supabase-js with the Clerk session token (`accessToken`) | Applies | Optional: Realtime ping, own-row reads, Storage uploads with signed URLs. Not needed for MVP. |

```ts
// packages/auth/src/server.ts
import "server-only";
import { auth } from "@clerk/nextjs/server";

export type RlsClaims = { sub: string; roles: string[]; is_voter?: boolean };

/** Claims for withRls(). sessionClaims are already verified by Clerk middleware; never decode an unverified token. */
export async function getRlsClaims(): Promise<RlsClaims | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  return { sub: userId, roles: (sessionClaims?.roles as string[] | undefined) ?? [], is_voter: Boolean(sessionClaims?.is_voter) };
}

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}
```

Browser client (Realtime and optional own-row reads only):

```ts
// apps/web/lib/supabase-browser.ts
"use client";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

export function useSupabase() {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        accessToken: async () => (await session?.getToken()) ?? null,
      }),
    [session],
  );
}
```

**Why both, deliberately.** Writes need to touch tables that have no client policies at all (audit logs, revisions, invites), so they run through `adminDb` with explicit checks. RLS is still written correctly so that (a) the browser can safely use the publishable key for Realtime and own-row reads, and (b) server reads of private data through `withRls` cannot leak other users' rows even if a query forgets a filter. Defense in depth.

**Simpler alternative for MVP:** skip `withRls` and the browser read path; revoke `anon`/`authenticated` grants and use `adminDb` everywhere with code-level authorization. The policies (declared in the Drizzle schema) can stay in place, so client access can be opened table by table later.

### 8.4 Middleware (`proxy.ts` / `middleware.ts`)

```ts
// apps/web/middleware.ts  (named proxy.ts in newer Next.js versions)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAccount = createRouteMatcher(["/account(.*)", "/:sport/bracket-challenge/:division/:year/my-bracket(.*)"])  // join can stay public-ish but still signed-in;

export default clerkMiddleware(async (auth, req) => {
  if (isAccount(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\.(?:css|js|png|jpg|jpeg|webp|avif|svg|ico|woff2?|txt|xml)).*)", "/(api|trpc)(.*)"],
};
```

```ts
// apps/admin/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const STAFF = ["admin", "poll_admin", "bracket_admin", "data_admin", "editor"];

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth.protect();
  const roles = (sessionClaims?.roles as string[] | undefined) ?? [];
  if (!roles.some((r) => STAFF.includes(r))) {
    return new Response(null, { status: 403 }); // rendered by app/forbidden.tsx: "Staff only" + link to vote. (no redirect)
  }
});
```

```ts
// apps/vote/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { AUTHORIZED_PARTIES } from "@rs/auth/authorized-parties";

const isPublic = createRouteMatcher(["/invite(.*)", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
}, { authorizedParties: [...AUTHORIZED_PARTIES] });
```

Route-level checks still happen in the page/action (`requireRole`) because middleware is a coarse filter.

### 8.5 Webhooks: Clerk → Supabase mirror

Events to subscribe: `user.created`, `user.updated`, `user.deleted`, `session.created` (optional, for last-seen), `organizationMembership.*` (if orgs are used), and billing events if using Clerk Billing.

```ts
// packages/db/src/queries/users.ts
import { and, eq, inArray, isNull, lt, notInArray, or, sql } from "drizzle-orm";
import type { UserJSON } from "@clerk/backend";
import { adminDb } from "../client";
import { users, userRoles, USER_ROLES } from "../schema";

type Role = (typeof USER_ROLES)[number];

export async function upsertUserFromClerk(u: UserJSON) {
  const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address ?? null;
  const updatedAt = new Date(u.updated_at);
  const roles = ((u.public_metadata?.roles as string[] | undefined) ?? []).filter((r): r is Role => (USER_ROLES as readonly string[]).includes(r));

  await adminDb.transaction(async (tx) => {
    const [row] = await tx.insert(users).values({
      id: u.id, email: primary, firstName: u.first_name, lastName: u.last_name, imageUrl: u.image_url, clerkUpdatedAt: updatedAt,
    }).onConflictDoUpdate({
      target: users.id,
      set: { email: primary, firstName: u.first_name, lastName: u.last_name, imageUrl: u.image_url, clerkUpdatedAt: updatedAt, deletedAt: null },
      setWhere: or(isNull(users.clerkUpdatedAt), lt(users.clerkUpdatedAt, updatedAt)),   // ignore out-of-order (older) events
    }).returning({ id: users.id });
    if (!row) return;                                                                      // stale event: nothing changed

    // Mirror roles exactly: Clerk publicMetadata.roles is the source of truth for staff roles and the coarse "voter" role
    await tx.delete(userRoles).where(roles.length ? and(eq(userRoles.userId, u.id), notInArray(userRoles.role, roles)) : eq(userRoles.userId, u.id));
    if (roles.length) await tx.insert(userRoles).values(roles.map((role) => ({ userId: u.id, role }))).onConflictDoNothing();
  });
}

export async function softDeleteUser(id: string) {
  await adminDb.update(users).set({ deletedAt: new Date(), firstName: null, lastName: null, email: null, imageUrl: null }).where(eq(users.id, id));
}
```

```ts
// apps/web/app/api/webhooks/clerk/route.ts
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { adminDb } from "@rs/db";
import { webhookEvents } from "@rs/db/schema";
import { upsertUserFromClerk, softDeleteUser } from "@rs/db/queries/users";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  let evt;
  try {
    evt = await verifyWebhook(req); // uses CLERK_WEBHOOK_SIGNING_SECRET (svix)
  } catch {
    return new Response("invalid signature", { status: 400 });
  }
  const svixId = req.headers.get("svix-id") ?? crypto.randomUUID();
  const [fresh] = await adminDb.insert(webhookEvents).values({ id: svixId, source: "clerk", type: evt.type })
    .onConflictDoNothing().returning({ id: webhookEvents.id });
  if (!fresh) return new Response("duplicate");       // already processed (svix retries)
  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated":
        await upsertUserFromClerk(evt.data);
        break;
      case "user.deleted":
        if (evt.data.id) await softDeleteUser(evt.data.id);
        break;
    }
    return new Response("ok");
  } catch (err) {
    await adminDb.delete(webhookEvents).where(eq(webhookEvents.id, svixId)); // allow the retry to process it
    Sentry.captureException(err, { tags: { webhook: "clerk", type: evt.type } });
    return new Response("error", { status: 500 }); // svix retries with backoff
  }
}
```

Idempotency: upserts are keyed on the Clerk id and ignore events older than `clerk_updated_at`; `webhook_events` dedupes svix message ids.

**Lazy upsert fallback:** webhooks can arrive after the user's first request. Any server action that needs a user row calls `ensureUser(userId)` which fetches from Clerk's backend API and upserts if missing.

### 8.6 Deletion and privacy

`user.deleted` → soft-delete the row (`deleted_at`), anonymize display fields, keep ballots for poll integrity (ballot shows "Former voter" if the voter deletes their account; published polls must stay reproducible). Bracket entries are removed from leaderboards and anonymized. Document this in the privacy policy.
