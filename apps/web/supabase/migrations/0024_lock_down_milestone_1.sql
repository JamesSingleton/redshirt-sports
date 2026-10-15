-- Lock down Milestone 1 tables the same way as 0020_lock_down_data_api.
--
-- Next.js talks to Postgres through Drizzle and DATABASE_URL (a privileged
-- role that bypasses RLS). Clerk is the identity provider. There is no
-- supabase-js client, so these tables get no policies and no grants.

ALTER TABLE public.voter_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.voter_invites FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.bracket_formats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.bracket_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.bracket_entries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.newsletter_lists FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.newsletter_subscriptions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.contact_submissions FROM PUBLIC, anon, authenticated;
