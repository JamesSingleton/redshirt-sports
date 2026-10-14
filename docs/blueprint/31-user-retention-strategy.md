## 31. User retention strategy

Retention goal: turn a search or social visitor into someone who **comes back every week** (poll release day, game-week coverage, bracket season). Redshirt's weekly heartbeat already exists (the Top 25 release). Retention design hangs every feature off that heartbeat and off **who the reader follows**.

### 31.1 Principles

1. **Value before asks.** Anonymous readers get the full newsroom, polls, ballots and bracket viewing. Sign-in unlocks *personal* value: follows, saved articles, bracket entries, alerts. No paywall early (§20).
2. **Light, non-annoying prompts.** At most **one** sign-in prompt per session, never a modal on first article view, never on a reader's first visit from search. Prompts are contextual: tapping "Follow", "Save", "Make picks", "Notify me" is the moment to ask.
3. **Every account feature is gated behind Clerk sign-in** (`<SignedIn>` / `<SignedOut>`; server actions call `requireUserId()`). Anonymous state that matters (a draft bracket, a half-built Top 25, team picks in onboarding) is kept in `localStorage` and **merged into the account on sign-up** so nothing is lost.
4. **The weekly loop beats the daily habit.** College sports interest is weekly and seasonal; optimize for W1/W4 return and poll-day reach, not daily streaks.
5. **Measure everything with one event schema** (§31.10). Every retention feature has a funnel and a target.

### 31.2 Prompt rules (what triggers a sign-in ask)

| Trigger | Prompt | Frequency cap |
|---|---|---|
| Click Follow / Save / Notify / Make picks / Build your Top 25 | Clerk `<SignIn>` in a shadcn `Dialog` (or `Drawer` on mobile), with the intent remembered and completed after sign-in | Unlimited (user-initiated) |
| 3rd article in a session, never 1st/2nd | Inline card at article end: "Follow {primary team} for a personalized feed" | 1 per session, 1 per 7 days after dismiss |
| Home page, returning visitor (2+ visits in 14 days) | Dismissible "Follow your teams" bar (see home mockup) | Hidden for 30 days after dismiss; never for signed-in users with follows |
| Poll page on release day | "Notify me when next week's poll drops" button (no auto-popup) | — |
| PWA install | Custom install card after the 2nd session that included a poll or bracket view, only on supported browsers | 1 per 30 days |
| Push permission | Only after an explicit "Notify me" tap (never on load) | Browser-level |

Implementation: a `usePromptBudget()` hook in `packages/ui` reads `localStorage` (`rs.prompts.v1`) and a PostHog feature flag (`retention-prompts`) so prompt intensity can be tuned without deploys.

### 31.3 Follows and personalization

**Follow targets**: schools (all sports, from the sport-agnostic team hub `/teams/{school-nickname}`), a school's single sport (e.g. Montana State football only), conferences, divisions (e.g. "FCS"), and people (writers). Data:

```sql
-- Same DDL as §10.2 (v1.3 replaced the v1.2 user_favorites table; no data migration needed for a fresh build).
create table user_follows (
  user_id text not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('school','team','conference','division','person')),
  target_id text not null,                     -- school uuid (all sports), team uuid (school+sport), conference id, 'cfb:fcs', Sanity person _id
  notify_push boolean not null default false,
  notify_email boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index on user_follows (target_type, target_id);   -- fan-out for alerts
-- RLS: own rows only (select/insert/delete using user_id = app.uid())
```

```ts
// packages/db/src/queries/follows.ts
export async function toggleFollow(userId: string, t: { type: FollowType; id: string }, on: boolean) {
  if (on) await adminDb.insert(userFollows).values({ userId, targetType: t.type, targetId: t.id }).onConflictDoNothing();
  else await adminDb.delete(userFollows).where(and(eq(userFollows.userId, userId), eq(userFollows.targetType, t.type), eq(userFollows.targetId, t.id)));
  // PostHog server event, cache tag for the user's feed
  capture(userId, on ? "follow_added" : "follow_removed", { target_type: t.type, target_id: t.id });
}
```

#### What following does (plain-language, shown in the Follow dialog and `/account/follows`)

Following is the one action that makes Redshirt yours. It never costs anything and never unlocks a paywall. When you follow something:

| You follow | What changes | Default | Where you control it |
|---|---|---|---|
| A school (e.g. Montana State Bobcats, all sports) | Its stories from every sport are boosted in **For you** on the home page; its badge appears in your header menu and mobile "Your teams" row; it's in your **My Teams** weekly email | Feed on, email on, push off | Follow button on the team hub; `/account/follows` |
| One sport of a school (e.g. Bobcats football) | Same as above for that sport only; poll-movement alerts for that team when its poll publishes | Feed on, email on, push off | Sport tab on the team hub |
| A division (e.g. FCS) | Division stories in For you; the rankings widget and bracket CTA default to that division; **poll-release** alert for that division | Feed on, poll-release email on | Division hub; onboarding |
| A conference | Conference stories in For you; conference roundups in My Teams | Feed on | Conference hub |
| A writer | Their new stories in For you; optional "new from {writer}" email | Feed on, email off | Byline Follow chip |

What following does **not** do: it doesn't make your follows public, doesn't change what voters see or the poll, doesn't affect bracket scoring, and doesn't send push notifications unless you turn push on per follow. Anonymous readers can follow too (stored in the browser); signing in syncs those follows to your account.

**Personalized home ("For you" tab):**

- The home shell stays static (PPR). A `<Suspense>` hole renders "For you" for signed-in users with follows: GROQ `*[_type=="post" && (references($schoolDocIds) || $division in divisions || references($personIds))] | order(publishedAt desc)[0...30]`, cached per user with a short `cacheLife` (or `"use cache: private"`), tag `feed:user:<id>`.
- Ranking: recency first, boost followed-team matches ×2, editor-pinned "Top stories" always first. No ML in v1.
- The rankings widget defaults to the user's first followed division; the bracket CTA to the division they follow.
- Anonymous readers: "All" tab plus a localStorage-only follow list (so onboarding works before sign-up) that drives the same query via a client fetch to a cached route handler.

**Onboarding picker** (first sign-in, or the "Follow teams" button):

1. Step 1 "Which levels do you follow?": division chips (FBS, FCS, D-II, D-III, MBB, WBB).
2. Step 2 "Pick your teams": searchable list (shadcn `Command`), grouped by conference, multi-select, suggestions from geolocation-free signals (the article that brought them in, last viewed hubs).
3. Step 3 "How should we keep you posted?": newsletter toggles (Daily, Poll release, My teams) and "Enable push for poll releases" (requests permission only if toggled).
4. Done → land on "For you". Skip is always visible; the whole thing is a shadcn `Dialog` on desktop and a full-height `Drawer` on mobile.

### 31.4 Newsletters (Resend)

| List | Cadence | Content | Audience |
|---|---|---|---|
| **The Redshirt Daily** | Weekdays 6:00 AM PT | Top stories + editor note; 6–8 links | Opt-in |
| **Poll Release** | Weekly, at poll publish (in-season) | Top 10 for each followed division, biggest movers, link to ballots | Opt-in; default on in onboarding |
| **My Teams** | Weekly (Thu) + breaking only if the user opts in | Articles tagged with followed teams/conferences in the past 7 days; skipped if empty | Auto for users with follows + email opt-in |
| **Bracket Challenge** | Event-driven | Opens, lock in 24 h, daily standing recap during the event | Entrants only |

- Built with React Email (`packages/emails`), sent with Resend (Broadcasts for list sends, batch API for personalized My Teams). Double opt-in for anonymous signups; signed-in users with verified Clerk emails can opt in with one click.
- Every link carries `utm_source=newsletter&utm_medium=email&utm_campaign=<list>-<yyyy-mm-dd>`; the web app captures UTMs to PostHog so newsletter CTR and downstream sessions join in one funnel.
- Resend webhooks (`email.delivered`, `email.opened` if enabled, `email.clicked`, `email.bounced`, `email.complained`) write to `newsletter_events` for CTR and list health; complaints auto-unsubscribe.

### 31.5 Web push (followed teams + poll releases)

- Service worker from the PWA (§21), VAPID keys, `push_subscriptions` table (exists). Sends via `web-push` from an admin cron route or right after the poll publish job.
- Topics: `poll:<slug>` (release), `team:<id>` (new article about a followed team, max 2/day per user, quiet hours 10 PM–7 AM user local), `bracket:<event>` (lock reminders, result-entry recap).
- iOS: works only for installed PWAs (Home Screen) on supported iOS versions; the install card explains this on iOS Safari.
- Permission is requested only after an explicit tap (§31.2). Each notification has a "Manage" link to `/account/notifications`.

### 31.6 Bracket challenge retention

- **Groups are the retention engine**: creating a group and inviting friends gives a reason to return daily during the event. Prompt "Create a group" immediately after saving a bracket; group invite links have rich OG cards.
- Reminders: 24 h and 1 h before lock for incomplete entries (email + push); "Your standing after Round 1" recaps after staff enter results (§14.9).
- After the event: "Follow the champion's coverage" and "Get next season's bracket alert" (adds a `bracket:<division>` topic follow).

### 31.7 Poll engagement

- **Notify me** on poll pages → `poll:<slug>` topic follow (email and/or push).
- **Ballot transparency as content**: "Biggest outlier ballot this week", "Voter consensus" modules link to individual ballots (credibility + shareability).

No fan vote and no fan-built rankings (removed in v1.5): the only Top 25 on Redshirt is the voters' poll, which keeps the poll page unambiguous and removes a moderation and data-retention surface.

### 31.8 Reading features

| Feature | Decision | Notes |
|---|---|---|
| **Saved articles** | Yes (P1) | `saved_items(user_id, sanity_id, saved_at)`; bookmark icon on cards and article header; `/account/saved` |
| **Related / next article** | Yes (P0) | End-of-article "More on {team}" (same school refs) and "Up next" (editor-picked or same sport latest) |
| **Infinite next article** | Yes (P1), max 3 deep | When the reader reaches the end, the next article loads below (Server Component fetched via a route handler). `history.replaceState` updates the URL; each article fires its own `$pageview` and has its own ad slots with reserved heights. The canonical stays per-article; crawlers see a normal "Up next" link |
| **Reading streaks** | Maybe (P3) | Weekly streaks ("4 poll weeks in a row") fit the cadence better than daily streaks. Only shown in the account page, never as a nag. Ship only if W4 retention stalls |
| **Recently viewed hubs** | Yes (P1) | localStorage; powers onboarding suggestions |

### 31.9 Comments: recommendation

**Do not launch comments in 2026–27.** Reasons: moderation cost and liability, low signal on small-college coverage, CLS/performance cost of third-party widgets, and the brand risk around voter ballots (harassment of named voters). Instead:

- Point conversation to Redshirt's X accounts and newsletters (reply-to-email reaches writers).
- Offer structured participation that can't turn toxic: bracket groups.
- Revisit in 2027 with a moderated, signed-in-only option (Clerk identity, rate limits, keyword filters, "voter pages excluded"). If you do, prefer a third-party with moderation tooling over building it.

### 31.10 Share cards and PWA

- **OG cards** (`next/og`) for every shareable object: article, poll week (top 5 + movers), team rank card ("No. 2 in the Redshirt FCS Top 25"), bracket entry (champion + final four), group invite. All use the brand tokens and the Barlow Condensed display face.
- Share buttons use the Web Share API on mobile with a copy-link fallback; every share fires `share_clicked` with `{object_type, channel}`.
- **PWA**: manifest with shortcuts (Rankings, My Bracket, For you), offline fallback page, custom install card (§31.2). Track `pwa_install_prompted`, `pwa_installed` (via `appinstalled`), and display-mode on each session.

### 31.11 Account value without a paywall

What a free account gets (shown on the sign-up dialog and `/account`): follow teams/conferences/writers, personalized "For you" feed, saved articles, bracket entries and groups, newsletter and push preferences, dark mode sync across devices (stored in Clerk `unsafeMetadata` or Postgres). Later (P2+): premium tier adds ad-light and early newsletters (§20), never paywalled polls or ballots.

### 31.12 Metrics, PostHog events and funnels

**Event schema** (snake_case, defined once in `packages/analytics/events.ts`; server events use the Clerk user id as `distinct_id` after `identify`):

| Event | Key properties | Fired from |
|---|---|---|
| `$pageview` | `page_type` (home/article/hub/poll/bracket/ballot/page), `sport`, `division`, `article_id`, `utm_*` | client (auto) |
| `article_read` | `article_id`, `percent` (25/50/75/100), `seconds` | client scroll observer |
| `next_article_loaded` | `from_id`, `to_id`, `depth` | client |
| `signin_prompt_shown` / `signin_prompt_clicked` / `signin_prompt_dismissed` | `trigger`, `surface` | client |
| `signed_up` / `signed_in` | `method`, `intent` (follow/save/bracket) | Clerk webhook (server) |
| `onboarding_started` / `onboarding_step_completed` / `onboarding_completed` / `onboarding_skipped` | `step`, `follows_count` | client |
| `follow_added` / `follow_removed` | `target_type`, `target_id` | server |
| `article_saved` | `article_id` | server |
| `newsletter_subscribed` / `newsletter_confirmed` / `newsletter_unsubscribed` | `list` | server |
| `newsletter_clicked` | `list`, `campaign` | landing pageview with `utm_medium=email` |
| `push_permission_requested` / `push_subscribed` / `push_clicked` | `topic` | client/server |
| `poll_viewed` / `ballots_viewed` / `notify_me_clicked` | `poll`, `week` | client |
| `bracket_started` / `bracket_saved` / `bracket_completed` / `group_created` / `group_joined` | `event`, `picks_count` | server |
| `share_clicked` | `object_type`, `channel` | client |
| `pwa_install_prompted` / `pwa_installed` | — | client |

**Funnels (PostHog Funnels insights, saved in a "Retention" dashboard):**

1. **Activation**: `$pageview` (first visit) → `signin_prompt_clicked` → `signed_up` → `onboarding_completed` → `follow_added` (≥ 1). Conversion window 7 days.
2. **Newsletter**: `newsletter_subscribed` → `newsletter_confirmed` → `newsletter_clicked` (within 14 days).
3. **Bracket**: `bracket_started` → `bracket_completed` → `group_created` or `group_joined` → return session during event.
4. **Poll engagement**: `poll_viewed` → `ballots_viewed` → `poll_shared` (or `poll_notify_on`).
5. **Article depth**: `$pageview` (article) → `article_read` 75% → `next_article_loaded`.

**Cohort retention definitions (PostHog Retention insight):**

| Metric | Definition | Target (estimate) |
|---|---|---|
| **D1 retention** | % of users (new `distinct_id` that performed `$pageview`) who return with any `$pageview` on day 1 after first seen | Anonymous 8–12%; signed-in 25–35% |
| **D7 retention** | Return with `$pageview` on any of days 6–8 (smoothed window) | Anonymous 5–8%; signed-in 30–40% |
| **D30 retention** | Return on any of days 27–33 | Anonymous 3–5%; signed-in 20–30% |
| **W1 / W4 (weekly)** | Return in week 1 / week 4 after signup (more useful for weekly cadence) | Signed-in W4 ≥ 35% in-season |
| **Signed-in rate** | Signed-in weekly actives ÷ all weekly actives | 5% at launch → 12% by end of season one |
| **Follows per account** | Median follows after onboarding | ≥ 2 |
| **Onboarding completion** | `onboarding_completed` ÷ `onboarding_started` | ≥ 60% |
| **Newsletter CTR** | Unique clickers ÷ delivered, per send (Resend `email.clicked` / `email.delivered`) | Daily 8–15%; Poll Release 15–25%; My Teams 10–20% |
| **Newsletter confirm rate** | Confirmed ÷ subscribed (double opt-in) | ≥ 70% |
| **Push CTR** | `push_clicked` ÷ sent | 4–10% |
| **Bracket group rate** | Entrants in ≥ 1 non-national group ÷ entrants | ≥ 40% |
| **Bracket return** | Entrants with ≥ 2 sessions during the event | ≥ 60% |
| **Poll-day reach** | Users with `poll_viewed` within 24 h of publish ÷ prior 4-week WAU | ≥ 30% |

All targets are **estimates** for planning, not benchmarks from the reference sites. Revisit after the first 8 in-season weeks.

**Dashboards**: "Retention" (the table above, weekly), "Poll day" (release-day traffic by source, newsletter vs. push vs. organic), "Bracket" (funnel + concurrency at lock). PostHog cohorts: `signed_in_with_follows`, `newsletter_daily_active` (clicked in last 30 days), `bracket_entrants_<event>`, `lapsed_30d` (for win-back emails).

### 31.13 Retention roadmap

| Phase | Items |
|---|---|
| MVP (Phase 1) | Follow button + `user_follows`, onboarding picker, "For you" tab, related/next modules, Poll Release newsletter, OG cards, event schema + Activation funnel |
| Season one (Phase 2) | Daily + My Teams newsletters, web push, saved articles, infinite next article, bracket reminders/recaps, PWA install card, retention dashboard |
| Later | Weekly streaks (if needed), win-back emails for `lapsed_30d`, comments decision revisit, premium tier |
