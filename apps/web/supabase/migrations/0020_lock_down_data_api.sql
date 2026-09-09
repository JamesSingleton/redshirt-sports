-- Lock down the Supabase Data API for this project.
--
-- Access model: Next.js apps talk to Postgres via Drizzle + DATABASE_URL
-- (privileged role; bypasses RLS). Clerk handles auth in application code.
-- There is no supabase-js / PostgREST client in the app.
--
-- Do NOT add auth.uid()-based policies here — Supabase Auth is not the
-- identity provider. Row ownership is enforced in server actions / API routes.
--
-- Overly-permissive "Enable read access for all users" policies previously
-- exposed users_table, voter_ballot, and other tables to the anon key.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'Enable read access for all users'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- Keep RLS enabled so any future GRANT to anon/authenticated stays deny-by-default
-- until an intentional policy is added.
ALTER TABLE public.ballot_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_ballot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_final_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_team_rankings ENABLE ROW LEVEL SECURITY;
