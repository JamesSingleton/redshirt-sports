-- Milestone 1 gap: invites and bracket events beside the existing poll tables.
-- Existing ballots, polls, and schools are unchanged.

CREATE TABLE "voter_invites" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "poll_id" text NOT NULL REFERENCES "polls"("id"),
  "season_id" text NOT NULL REFERENCES "seasons"("id"),
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "invited_by" text NOT NULL REFERENCES "users_table"("id"),
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX "voter_invites_one_pending"
  ON "voter_invites" ("email", "poll_id", "season_id")
  WHERE "status" = 'pending';

CREATE INDEX "voter_invites_poll_season_status"
  ON "voter_invites" ("poll_id", "season_id", "status");

CREATE TABLE "bracket_formats" (
  "code" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "sport_id" text NOT NULL REFERENCES "sports"("id"),
  "team_count" integer NOT NULL,
  "game_count" integer NOT NULL,
  "rounds" integer NOT NULL,
  "definition" jsonb NOT NULL
);

CREATE TABLE "bracket_events" (
  "id" text PRIMARY KEY NOT NULL,
  "sport_id" text NOT NULL REFERENCES "sports"("id"),
  "division" text NOT NULL,
  "season_id" text NOT NULL REFERENCES "seasons"("id"),
  "year" integer NOT NULL,
  "format_code" text NOT NULL REFERENCES "bracket_formats"("code"),
  "name" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "lock_at" timestamptz NOT NULL,
  CONSTRAINT "bracket_events_one_per_division_season" UNIQUE ("sport_id", "division", "season_id")
);

CREATE TABLE "bracket_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "event_id" text NOT NULL REFERENCES "bracket_events"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users_table"("id"),
  "name" text NOT NULL,
  "status" text DEFAULT 'incomplete' NOT NULL,
  "score" integer DEFAULT 0 NOT NULL
);

CREATE INDEX "bracket_entries_event_id" ON "bracket_entries" ("event_id");
CREATE INDEX "bracket_entries_user_id" ON "bracket_entries" ("user_id");

ALTER TABLE "voter_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bracket_entries" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON "bracket_entries" TO authenticated;
GRANT SELECT ON "voter_invites" TO authenticated;

CREATE POLICY "bracket_entries_select_own"
  ON "bracket_entries"
  FOR SELECT
  TO authenticated
  USING (
    "user_id" = coalesce(current_setting('request.jwt.claims', true), '{}')::json->>'sub'
  );
