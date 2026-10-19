## 11. Row Level Security policies

### 11.1 Posture

- RLS is **enabled on every table** in `public`. Tables with no policy are deny-all for `anon`/`authenticated` (only the service role and direct DB connections bypass RLS).
- **Public read** is granted only on reference data and published results.
- **Own-row** access uses `app.uid()` (the Clerk `sub`).
- **Staff** access uses `app.has_role()` from JWT claims. Admin tools generally use the service connection anyway; staff policies exist for the admin app's client-side tables (e.g. live ballot counter).
- Lock enforcement for ballots and picks lives in **server-side Drizzle transactions with row locks** (§13.7, §14.4), not in policies, because "is the window open" needs joins, row locks and clear error messages.
- **Declared in Drizzle.** Every policy below is written with `pgPolicy()` next to its table in `packages/db/src/schema` (§10.12), and drizzle-kit generates the SQL shown here. The SQL is the reviewable, testable form.
- Policies apply to `anon`/`authenticated`: the browser (supabase-js) and server code running inside `withRls()` (§10.13). `adminDb` uses the `rs_server` role with `BYPASSRLS` and must authorize in code.
- Always wrap `auth.jwt()` calls in a subselect `(select app.uid())` so Postgres evaluates them once per statement, not per row.

### 11.2 Policies

```sql
-- Enable RLS everywhere
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Reference data: public read
create policy "public read" on sports          for select using (true);
create policy "public read" on divisions       for select using (true);
create policy "public read" on schools         for select using (true);
create policy "public read" on teams           for select using (true);
create policy "public read" on conferences     for select using (true);
create policy "public read" on seasons         for select using (true);
create policy "public read" on weeks           for select using (true);
create policy "public read" on team_seasons    for select using (true);
create policy "public read" on venues          for select using (true);
create policy "public read" on polls           for select using (true);
create policy "public read" on bracket_formats for select using (true);

-- Users: read own row; public display fields exposed via a view instead
create policy "own row" on users for select using (id = (select app.uid()));
create view public_profiles with (security_invoker = false) as
  select id, display_name, image_url from users where deleted_at is null;
-- (grant select on public_profiles to anon, authenticated)

-- Favorites: full control of own rows
create policy "own follows" on user_follows
  for all using (user_id = (select app.uid())) with check (user_id = (select app.uid()));
create policy "own saved" on saved_items
  for all using (user_id = (select app.uid())) with check (user_id = (select app.uid()));

-- Poll weeks: public sees published weeks; voters see open weeks of polls they vote in
create policy "published weeks" on poll_weeks for select using (status = 'published');
create policy "voter sees own polls' weeks" on poll_weeks for select using (
  exists (select 1 from voters v
          where v.poll_id = poll_weeks.poll_id and v.season_id = poll_weeks.season_id
            and v.user_id = (select app.uid()) and v.status = 'active')
);

-- Poll results: public only after publish
create policy "published results" on poll_results for select using (
  exists (select 1 from poll_weeks w where w.id = poll_results.poll_week_id and w.status = 'published')
);
create policy "published summaries" on poll_week_summaries for select using (
  exists (select 1 from poll_weeks w where w.id = poll_week_summaries.poll_week_id and w.status = 'published')
);

-- Voters: public roster of active voters (transparency); own row always
create policy "public voter roster" on voters for select using (status = 'active');

-- Voter invites: no policies at all (RLS enabled = deny). Only admin server code (adminDb) reads or writes them;
-- invite acceptance goes through a server action that verifies the signed token (§13.4).

-- Ballots: owner can read always; everyone can read after the week is published (transparency)
create policy "own ballots" on ballots for select using (
  exists (select 1 from voters v where v.id = ballots.voter_id and v.user_id = (select app.uid()))
);
create policy "published ballots" on ballots for select using (
  status = 'locked' and exists (select 1 from poll_weeks w where w.id = ballots.poll_week_id and w.status = 'published')
);
-- No insert/update policy: writes only via the server's submitBallot() Drizzle transaction (§13.7)

create policy "ballot entries follow ballot" on ballot_entries for select using (
  exists (select 1 from ballots b where b.id = ballot_entries.ballot_id)   -- ballots RLS applies inside
);

-- Brackets: public reference
create policy "public events" on bracket_events for select using (status <> 'draft');
create policy "public slots" on bracket_slots for select using (
  exists (select 1 from bracket_events e where e.id = bracket_slots.event_id and e.status <> 'draft'));
create policy "public bracket games" on bracket_games for select using (
  exists (select 1 from bracket_events e where e.id = bracket_games.event_id and e.status <> 'draft'));

-- Entries: owner always; others only after lock AND if they share a group or the entry is in a public/system group
create policy "own entries" on bracket_entries for select using (user_id = (select app.uid()));
create policy "entries visible after lock" on bracket_entries for select using (
  exists (select 1 from bracket_events e where e.id = bracket_entries.event_id and now() >= e.lock_at)
  and exists (
    select 1 from bracket_group_members m
    join bracket_groups g on g.id = m.group_id
    where m.entry_id = bracket_entries.id
      and (g.visibility in ('public','system')
           or exists (select 1 from bracket_group_members me
                      where me.group_id = g.id and me.user_id = (select app.uid())))
  )
);
create policy "picks follow entries" on bracket_picks for select using (
  exists (select 1 from bracket_entries be where be.id = bracket_picks.entry_id)  -- entry RLS applies
);
-- Writes only via server Drizzle transactions: saveBracketEntry(), joinGroup(), createGroup() (§14.4, §14.7)

-- Groups: members and public/system visible; private group discoverable only via invite RPC
create policy "group visibility" on bracket_groups for select using (
  visibility in ('public','system')
  or manager_id = (select app.uid())
  or exists (select 1 from bracket_group_members m where m.group_id = bracket_groups.id and m.user_id = (select app.uid()))
);
create policy "membership visibility" on bracket_group_members for select using (
  exists (select 1 from bracket_groups g where g.id = bracket_group_members.group_id)  -- group RLS applies
);

-- Newsletter, push, entitlements: own rows only
create policy "own subs" on newsletter_subscriptions for select using (user_id = (select app.uid()));
create policy "own push" on push_subscriptions for all using (user_id = (select app.uid())) with check (user_id = (select app.uid()));
create policy "own entitlements" on entitlements for select using (user_id = (select app.uid()));

-- Audit logs, webhook_events, redirects, poll_week_team_records, ballot_revisions, meter_events, voter_invites, user_roles, contact_submissions: no policies (server-only)
```

**Note on the `invite_code` column:** because public groups are readable, do not let the `invite_code` leak. Either move it to a separate `bracket_group_secrets` table with no select policy, or expose groups through a view that omits it. The blueprint uses the separate table in the final migration:

```sql
create table bracket_group_secrets (
  group_id uuid primary key references bracket_groups(id) on delete cascade,
  invite_code text not null unique
);
alter table bracket_group_secrets enable row level security;
create policy "manager reads code" on bracket_group_secrets for select using (
  exists (select 1 from bracket_groups g where g.id = group_id and g.manager_id = (select app.uid())));
```

### 11.3 Testing RLS

pgTAP tests in `supabase/tests/rls_*.test.sql` set the JWT and assert visibility:

```sql
begin;
select plan(3);
-- simulate Clerk user
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_A","role":"authenticated"}', true);

select is((select count(*)::int from bracket_entries where user_id = 'user_B'), 0,
  'cannot see other users entries before lock');
select is((select count(*)::int from ballots b join poll_weeks w on w.id=b.poll_week_id where w.status='open'), 0,
  'non-voter cannot see open ballots');
select throws_ok($$ insert into ballots (poll_week_id, voter_id) values (gen_random_uuid(), gen_random_uuid()) $$,
  '42501', null, 'direct ballot insert is denied');
select * from finish();
rollback;
```
