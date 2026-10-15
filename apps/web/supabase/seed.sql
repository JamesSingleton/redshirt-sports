-- Local fake data for Milestone 1. Idempotent. No real schools or people.
-- Apply with `supabase db reset --local` after migrations. Do not run against a remote database.

insert into public.sports (id, slug, name, display_name, is_active)
values ('example-sport-football', 'example-football', 'Example Football', 'Example Football', true)
on conflict (id) do nothing;

insert into public.seasons (id, year, display_name, start_date, end_date, sport_id)
values (
  'example-season-2026',
  2026,
  'Example 2026',
  '2026-08-01T00:00:00Z',
  '2026-12-15T00:00:00Z',
  'example-sport-football'
)
on conflict (id) do nothing;

insert into public.schools (id, name, short_name, abbreviation, nickname, slug)
values (
  'example-school-state',
  'Example State',
  'Example St.',
  'EXST',
  'Examples',
  'example-state'
)
on conflict (id) do nothing;

insert into public.users_table (id, "firstName", "lastName", organization, "organizationRole", "isAdmin", "isVoter")
values (
  'example-voter-1',
  'Example',
  'Voter',
  'Example Paper',
  'Writer',
  false,
  true
)
on conflict (id) do nothing;

insert into public.polls (id, sport_id, slug, name, is_active)
values (
  'example-poll-fcs',
  'example-sport-football',
  'example-fcs',
  'Example FCS Poll',
  true
)
on conflict (id) do nothing;

insert into public.voter_invites (
  id, email, poll_id, season_id, token_hash, expires_at, status, invited_by
)
values (
  'example-invite-1',
  'voter@example.com',
  'example-poll-fcs',
  'example-season-2026',
  'example-token-hash',
  '2026-12-01T00:00:00Z',
  'pending',
  'example-voter-1'
)
on conflict (id) do nothing;

insert into public.bracket_formats (code, name, sport_id, team_count, game_count, rounds, definition)
values (
  'example-fcs-24',
  'Example FCS 24',
  'example-sport-football',
  24,
  23,
  5,
  '{"teams":24}'::jsonb
)
on conflict (code) do nothing;

insert into public.bracket_events (
  id, sport_id, division, season_id, year, format_code, name, status, lock_at
)
values (
  'example-bracket-fcs-2026',
  'example-sport-football',
  'fcs',
  'example-season-2026',
  2026,
  'example-fcs-24',
  'Example FCS Bracket 2026',
  'draft',
  '2026-11-20T00:00:00Z'
)
on conflict (id) do nothing;

insert into public.newsletter_lists (id, name, description)
values ('example-list-fcs', 'Example FCS', 'Local example list')
on conflict (id) do nothing;
