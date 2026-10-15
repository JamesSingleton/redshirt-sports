CREATE TABLE "bracket_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'incomplete' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bracket_events" (
	"id" text PRIMARY KEY NOT NULL,
	"sport_id" text NOT NULL,
	"division" text NOT NULL,
	"season_id" text NOT NULL,
	"year" integer NOT NULL,
	"format_code" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"lock_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bracket_events_one_per_division_season" UNIQUE("sport_id","division","season_id")
);
--> statement-breakpoint
CREATE TABLE "bracket_formats" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sport_id" text NOT NULL,
	"team_count" integer NOT NULL,
	"game_count" integer NOT NULL,
	"rounds" integer NOT NULL,
	"definition" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"form_type" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"email" text NOT NULL,
	"list_id" text NOT NULL,
	"user_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirm_token_hash" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "newsletter_subscriptions_email_list" UNIQUE("email","list_id")
);
--> statement-breakpoint
CREATE TABLE "voter_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"poll_id" text NOT NULL,
	"season_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "voter_invites_status_check" CHECK ("voter_invites"."status" in ('pending', 'accepted', 'revoked', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "users_table" ADD COLUMN "deletedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bracket_entries" ADD CONSTRAINT "bracket_entries_event_id_bracket_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."bracket_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_entries" ADD CONSTRAINT "bracket_entries_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_events" ADD CONSTRAINT "bracket_events_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_events" ADD CONSTRAINT "bracket_events_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_events" ADD CONSTRAINT "bracket_events_format_code_bracket_formats_code_fk" FOREIGN KEY ("format_code") REFERENCES "public"."bracket_formats"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_formats" ADD CONSTRAINT "bracket_formats_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_list_id_newsletter_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."newsletter_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_invites" ADD CONSTRAINT "voter_invites_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_invites" ADD CONSTRAINT "voter_invites_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_invites" ADD CONSTRAINT "voter_invites_invited_by_users_table_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bracket_entries_event_id_index" ON "bracket_entries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "bracket_entries_user_id_index" ON "bracket_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bracket_events_season_id_index" ON "bracket_events" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "bracket_events_format_code_index" ON "bracket_events" USING btree ("format_code");--> statement-breakpoint
CREATE INDEX "contact_submissions_email_index" ON "contact_submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "newsletter_subscriptions_user_id_index" ON "newsletter_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voter_invites_one_pending" ON "voter_invites" USING btree ("email","poll_id","season_id") WHERE "voter_invites"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "voter_invites_poll_season_status" ON "voter_invites" USING btree ("poll_id","season_id","status");--> statement-breakpoint
CREATE INDEX "voter_invites_invited_by_index" ON "voter_invites" USING btree ("invited_by");