-- pgTAP: Milestone 1 tables are deny-by-default, and one bracket event exists per division.
-- Run with `supabase test db` against the local stack. This file rolls back.

begin;

select plan(4);

select ok(
  (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'voter_invites'
  ),
  'voter_invites has row level security enabled'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public' and tablename = 'bracket_entries'
  ),
  0,
  'bracket_entries has no policies'
);

set local role anon;

select throws_ok(
  'select count(*) from public.voter_invites',
  '42501',
  'anon cannot read voter_invites'
);

reset role;

insert into public.sports (id, slug, name)
values ('pgtap-sport', 'pgtap-sport', 'pgTAP Sport')
on conflict (id) do nothing;

insert into public.seasons (id, year, start_date, end_date, sport_id)
values (
  'pgtap-season',
  2099,
  '2099-01-01T00:00:00Z',
  '2099-12-01T00:00:00Z',
  'pgtap-sport'
)
on conflict (id) do nothing;

insert into public.bracket_formats (code, name, sport_id, team_count, game_count, rounds, definition)
values ('pgtap-format', 'pgTAP', 'pgtap-sport', 4, 3, 2, '{}'::jsonb)
on conflict (code) do nothing;

insert into public.bracket_events (
  id, sport_id, division, season_id, year, format_code, name, lock_at
)
values (
  'pgtap-event-1',
  'pgtap-sport',
  'fcs',
  'pgtap-season',
  2099,
  'pgtap-format',
  'First',
  '2099-11-01T00:00:00Z'
);

select throws_ok(
  $$insert into public.bracket_events (
    id, sport_id, division, season_id, year, format_code, name, lock_at
  ) values (
    'pgtap-event-2',
    'pgtap-sport',
    'fcs',
    'pgtap-season',
    2099,
    'pgtap-format',
    'Second',
    '2099-11-01T00:00:00Z'
  )$$,
  '23505',
  'a second event for the same sport, division, and season is rejected'
);

select * from finish();

rollback;
