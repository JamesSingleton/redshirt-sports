## 21. Notifications, newsletter, mobile and PWA

### 21.1 Notification matrix

| Trigger | Email | Web push | In-app |
|---|---|---|---|
| Breaking news about a favorite team | Optional digest | Yes (opt-in) | Badge |
| Poll published | Poll newsletter list | Topic `poll:<slug>` | Banner |
| Your team moved in the poll | Weekly digest | Yes | |
| Voter: invite (and reminder 3 days before expiry), window opened / closing in 12 h / 2 h / ballot received, roster renewal | Yes (transactional) | Yes | Admin app banner |
| Bracket: event opens, lock in 24 h / 1 h, group invite accepted, daily recap of your standing | Yes | Yes | |
| New article about a followed team | My Teams digest | Yes (opt-in, max 2/day) | |
| Subscription receipts/renewals | Yes (billing) | No | |

Retention strategy, newsletter lineup, push topics and metrics are specified in §31. User preferences live in a `notification_prefs` table (`user_id`, `channel`, `topic`, `enabled`), editable at `/account/notifications`. Every email has one-click unsubscribe (`List-Unsubscribe` + `List-Unsubscribe-Post` headers, required by major mailbox providers for bulk senders).

### 21.2 Newsletter with Resend

- Domain: send from a subdomain (`news.redshirtsports.com` for marketing, `mail.redshirtsports.com` for transactional) with SPF, DKIM, DMARC (`p=quarantine` once aligned) to protect the root domain's reputation.
- Lists: `daily` (top stories), `fcs-weekly`, `fbs-weekly`, `d2-d3-weekly`, `hoops-weekly`, `poll-alerts`, `bracket-challenge`, and per-team lists generated on demand (`team:<id>`).
- Double opt-in for marketing lists: signup action writes `pending` + hashed token, sends confirm email; confirm route flips to `active` and syncs to the Resend audience/segment.
- Templates in `packages/emails` (React Email) with shared header/footer; preview with `email dev`.
- Digest generation: a cron route on `apps/admin` queries Sanity for the last 24 h/7 d per list, renders, and sends a broadcast via the Resend API; logs to `newsletter_sends`.
- Webhooks from Resend (bounced, complained, delivered, opened if enabled) update `newsletter_subscriptions.status`.

```ts
// apps/web/app/(site)/newsletters/actions.ts
"use server";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { adminDb } from "@rs/db";
import { newsletterSubscriptions } from "@rs/db/schema";
import { sql } from "drizzle-orm";
import { ConfirmEmail } from "@rs/emails/confirm";
import { ratelimit } from "@/server/ratelimit";
import { headers } from "next/headers";

const schema = z.object({ email: z.email(), lists: z.array(z.string()).min(1).max(10), source: z.string().max(40) });
const resend = new Resend(process.env.RESEND_API_KEY);

export async function subscribe(input: unknown) {
  const { email, lists, source } = schema.parse(input);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = await ratelimit.limit(`newsletter:${ip}`);
  if (!success) return { ok: false, error: "Too many requests" };
  const token = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  await adminDb.insert(newsletterSubscriptions)
    .values(lists.map((listId) => ({ email, listId, source, status: "pending" as const, confirmTokenHash: hash })))
    .onConflictDoUpdate({
      target: [newsletterSubscriptions.email, newsletterSubscriptions.listId],
      set: { confirmTokenHash: hash },
      setWhere: sql`${newsletterSubscriptions.status} in ('pending','unsubscribed')`,   // don't touch active or bounced rows
    });
  await resend.emails.send({
    from: "Redshirt Sports <newsletters@news.redshirtsports.com>",
    to: email,
    subject: "Confirm your Redshirt Sports newsletter",
    react: ConfirmEmail({ url: `https://www.redshirtsports.com/newsletters/confirm?t=${token}` }),
  });
  return { ok: true };
}
```

### 21.3 Mobile and PWA

- **PWA first**: `app/manifest.ts` (name, icons 192/512 maskable, theme color, `display: standalone`, shortcuts to Rankings, My Bracket, Latest News), a service worker (Serwist) for offline shell + cached last-viewed articles and the user's bracket, and Web Push (VAPID) via `push_subscriptions`. iOS supports web push for installed home-screen web apps (iOS 16.4+).
- **Native apps later (P3)**: Expo (React Native) app in `apps/mobile` reusing `@rs/brackets`, `@rs/polls`, `@rs/db` types, Sanity queries and Clerk Expo SDK. Only justified once push/engagement data shows demand.
- **Mobile UX priorities**: bottom nav (Home, Rankings, Brackets, Me), thumb-friendly pick buttons ≥ 44×44 px, no interstitial ads.
