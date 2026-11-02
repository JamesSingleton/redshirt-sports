CREATE TABLE "poll_missed_ballots" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"poll_id" text NOT NULL,
	"user_id" text NOT NULL,
	"week_id" text NOT NULL,
	"excused_at" timestamp with time zone,
	"excuse_note" text,
	CONSTRAINT "poll_missed_ballots_poll_id_user_id_week_id_unique" UNIQUE("poll_id","user_id","week_id")
);
--> statement-breakpoint
ALTER TABLE "poll_voters" ADD COLUMN "locked_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "auto_publish" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_missed_ballots" ADD CONSTRAINT "poll_missed_ballots_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_missed_ballots" ADD CONSTRAINT "poll_missed_ballots_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_missed_ballots" ADD CONSTRAINT "poll_missed_ballots_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poll_missed_ballots_poll_id_week_id_index" ON "poll_missed_ballots" USING btree ("poll_id","week_id");--> statement-breakpoint
CREATE INDEX "poll_missed_ballots_user_id_index" ON "poll_missed_ballots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "poll_missed_ballots_week_id_index" ON "poll_missed_ballots" USING btree ("week_id");--> statement-breakpoint
ALTER TABLE "poll_missed_ballots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Backfill misses for weeks already published this season: voters assigned
-- before the week was published (and not revoked by then) with no ballot.
INSERT INTO "poll_missed_ballots" ("id", "poll_id", "user_id", "week_id")
SELECT gen_random_uuid()::text, "published"."poll_id", "pv"."user_id", "published"."week_id"
FROM (
  SELECT "pr"."poll_id", "pr"."week_id", min("pr"."created_at") AS "published_at"
  FROM "poll_rankings" "pr"
  INNER JOIN "weeks" "w" ON "w"."id" = "pr"."week_id"
  INNER JOIN "season_types" "st" ON "st"."id" = "w"."season_type_id"
  INNER JOIN "seasons" "s" ON "s"."id" = "st"."season_id"
  WHERE now() BETWEEN "s"."start_date" AND "s"."end_date"
  GROUP BY "pr"."poll_id", "pr"."week_id"
) "published"
INNER JOIN "poll_voters" "pv" ON "pv"."poll_id" = "published"."poll_id"
WHERE "pv"."created_at" <= "published"."published_at"
  AND ("pv"."revoked_at" IS NULL OR "pv"."revoked_at" > "published"."published_at")
  AND NOT EXISTS (
    SELECT 1 FROM "ballots" "b"
    WHERE "b"."poll_id" = "published"."poll_id"
      AND "b"."week_id" = "published"."week_id"
      AND "b"."user_id" = "pv"."user_id"
  )
ON CONFLICT DO NOTHING;
