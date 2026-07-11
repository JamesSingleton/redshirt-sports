-- Minimal local seed for rankings / vote / recruiting smoke tests.
-- Applied by `supabase db reset` (see apps/web/README.md).
-- IDs are stable placeholders — not production Sanity IDs.

INSERT INTO sports (id, slug, name, display_name, is_active)
VALUES
  ('sport-football', 'football', 'Football', 'College Football', true),
  ('sport-mens-basketball', 'mens-basketball', 'Men''s Basketball', 'Men''s Basketball', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO schools (id, name, sanity_id, short_name, abbreviation, nickname, top_25_eligible)
VALUES
  ('school-montana', 'Montana', 'sanity-school-montana', 'Montana', 'MONT', 'Grizzlies', true),
  ('school-ndsu', 'North Dakota State', 'sanity-school-ndsu', 'NDSU', 'NDSU', 'Bison', true),
  ('school-south-dakota-state', 'South Dakota State', 'sanity-school-sdsu', 'South Dakota St.', 'SDSU', 'Jackrabbits', true),
  ('school-idaho', 'Idaho', 'sanity-school-idaho', 'Idaho', 'IDHO', 'Vandals', true),
  ('school-montana-state', 'Montana State', 'sanity-school-msu', 'Montana St.', 'MTST', 'Bobcats', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users_table (id, "firstName", "lastName", organization, "organizationRole", "isAdmin", "isVoter")
VALUES
  ('user_local_voter', 'Local', 'Voter', 'Redshirt Sports', 'Writer', false, true),
  ('user_local_admin', 'Local', 'Admin', 'Redshirt Sports', 'Editor', true, true)
ON CONFLICT (id) DO NOTHING;

-- FCS sample ballot (week 1, 2025) — enough rows for rankings cron / UI smoke tests
INSERT INTO voter_ballot ("userId", division, week, year, team_id, rank, points, sport_id)
VALUES
  ('user_local_voter', 'fcs', 1, 2025, 'sanity-school-ndsu', 1, 25, 'sport-football'),
  ('user_local_voter', 'fcs', 1, 2025, 'sanity-school-sdsu', 2, 24, 'sport-football'),
  ('user_local_voter', 'fcs', 1, 2025, 'sanity-school-montana', 3, 23, 'sport-football'),
  ('user_local_voter', 'fcs', 1, 2025, 'sanity-school-msu', 4, 22, 'sport-football'),
  ('user_local_voter', 'fcs', 1, 2025, 'sanity-school-idaho', 5, 21, 'sport-football')
ON CONFLICT DO NOTHING;

INSERT INTO weekly_final_rankings (division, sport_id, week, year, rankings)
VALUES (
  'fcs',
  'sport-football',
  1,
  2025,
  '[
    {"_id":"sanity-school-ndsu","rank":1,"shortName":"NDSU","name":"North Dakota State","abbreviation":"NDSU","firstPlaceVotes":1,"points":25,"image":null},
    {"_id":"sanity-school-sdsu","rank":2,"shortName":"South Dakota St.","name":"South Dakota State","abbreviation":"SDSU","firstPlaceVotes":0,"points":24,"image":null},
    {"_id":"sanity-school-montana","rank":3,"shortName":"Montana","name":"Montana","abbreviation":"MONT","firstPlaceVotes":0,"points":23,"image":null},
    {"_id":"sanity-school-msu","rank":4,"shortName":"Montana St.","name":"Montana State","abbreviation":"MTST","firstPlaceVotes":0,"points":22,"image":null},
    {"_id":"sanity-school-idaho","rank":5,"shortName":"Idaho","name":"Idaho","abbreviation":"IDHO","firstPlaceVotes":0,"points":21,"image":null}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO seasons (id, year, display_name, start_date, end_date, sport_id)
VALUES (
  'season-football-2025',
  2025,
  '2025 College Football',
  '2025-08-01 00:00:00+00',
  '2026-01-15 00:00:00+00',
  'sport-football'
)
ON CONFLICT DO NOTHING;

INSERT INTO voter_poll_assignments (user_id, sport_id, division)
VALUES
  ('user_local_voter', 'sport-football', 'fcs')
ON CONFLICT DO NOTHING;
