-- Trigram matching for duplicate-player detection (players.name_search).
-- Supabase keeps extensions in the "extensions" schema; a fresh local or test
-- database may not have it yet.
CREATE SCHEMA IF NOT EXISTS "extensions";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";--> statement-breakpoint
CREATE TABLE "player_audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_id" bigint NOT NULL,
	"entity" text NOT NULL,
	"entity_id" bigint NOT NULL,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"actor_user_id" text,
	"push_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_duplicate_dismissals" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_duplicate_dismissals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_a_id" bigint NOT NULL,
	"player_b_id" bigint NOT NULL,
	"dismissed_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_duplicate_dismissals_pair_unique" UNIQUE("player_a_id","player_b_id"),
	CONSTRAINT "player_duplicate_dismissals_order_check" CHECK ("player_duplicate_dismissals"."player_a_id" < "player_duplicate_dismissals"."player_b_id")
);
--> statement-breakpoint
CREATE TABLE "player_enrollments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_sport_id" bigint NOT NULL,
	"school_id" text,
	"school_name" text,
	"start_year" smallint NOT NULL,
	"end_year" smallint,
	"via_recruitment_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_enrollments_school_check" CHECK (("player_enrollments"."school_id" is not null or "player_enrollments"."school_name" is not null)),
	CONSTRAINT "player_enrollments_years_check" CHECK ("player_enrollments"."end_year" is null or "player_enrollments"."end_year" >= "player_enrollments"."start_year")
);
--> statement-breakpoint
CREATE TABLE "player_sports" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_sports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_id" bigint NOT NULL,
	"sport_id" text NOT NULL,
	"position" text,
	"height_in" smallint,
	"weight_lb" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_sports_player_id_sport_id_unique" UNIQUE("player_id","sport_id"),
	CONSTRAINT "player_sports_height_in_check" CHECK ("player_sports"."height_in" is null or "player_sports"."height_in" between 48 and 96),
	CONSTRAINT "player_sports_weight_lb_check" CHECK ("player_sports"."weight_lb" is null or "player_sports"."weight_lb" between 80 and 500)
);
--> statement-breakpoint
CREATE TABLE "player_submissions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"status" text DEFAULT 'new' NOT NULL,
	"submitter_role" text NOT NULL,
	"submitter_name" text,
	"submitter_email" text NOT NULL,
	"payload" jsonb NOT NULL,
	"matched_player_id" bigint,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_submissions_status_check" CHECK ("player_submissions"."status" in ('new', 'accepted', 'rejected', 'spam')),
	CONSTRAINT "player_submissions_submitter_role_check" CHECK ("player_submissions"."submitter_role" in ('player', 'parent', 'coach', 'agent', 'other'))
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "players_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100000 CACHE 1),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"suffix" text,
	"slug" text NOT NULL,
	"name_search" text NOT NULL,
	"hometown_city" text,
	"hometown_state" text,
	"high_school_name" text,
	"hs_grad_year" smallint,
	"headshot" jsonb,
	"merged_into_id" bigint,
	"hidden_at" timestamp with time zone,
	"pending_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_merged_into_id_check" CHECK ("players"."merged_into_id" is null or "players"."merged_into_id" <> "players"."id"),
	CONSTRAINT "players_hs_grad_year_check" CHECK ("players"."hs_grad_year" is null or "players"."hs_grad_year" between 1990 and 2100)
);
--> statement-breakpoint
CREATE TABLE "portal_pushes" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "portal_pushes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_user_id" text,
	"trigger" text NOT NULL,
	"player_count" integer NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revalidated_at" timestamp with time zone,
	"error" text,
	CONSTRAINT "portal_pushes_trigger_check" CHECK ("portal_pushes"."trigger" in ('admin', 'cron'))
);
--> statement-breakpoint
CREATE TABLE "published_players" (
	"player_id" bigint PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"indexable" boolean DEFAULT false NOT NULL,
	"redirect_to_player_id" bigint,
	"doc" jsonb NOT NULL,
	"push_id" bigint,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_wire_events" (
	"event_id" bigint PRIMARY KEY NOT NULL,
	"recruitment_id" bigint NOT NULL,
	"player_id" bigint NOT NULL,
	"sport_id" text NOT NULL,
	"kind" text NOT NULL,
	"cycle_year" smallint NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"superseded" boolean DEFAULT false NOT NULL,
	"row" jsonb NOT NULL,
	"push_id" bigint,
	CONSTRAINT "published_wire_events_kind_check" CHECK ("published_wire_events"."kind" in ('transfer', 'high_school')),
	CONSTRAINT "published_wire_events_type_check" CHECK ("published_wire_events"."type" in ('entered', 'offered', 'committed', 'decommitted', 'signed', 'enrolled', 'withdrew'))
);
--> statement-breakpoint
CREATE TABLE "recruitment_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitment_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"recruitment_id" bigint NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"school_id" text,
	"school_name" text,
	"source_type" text,
	"source_url" text,
	"source_note" text,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recruitment_events_type_check" CHECK ("recruitment_events"."type" in ('entered', 'offered', 'committed', 'decommitted', 'signed', 'enrolled', 'withdrew')),
	CONSTRAINT "recruitment_events_source_type_check" CHECK ("recruitment_events"."source_type" is null or "recruitment_events"."source_type" in ('social', 'email', 'school', 'reporter', 'submission', 'redshirt')),
	CONSTRAINT "recruitment_events_school_check" CHECK (("recruitment_events"."type" in ('offered', 'committed', 'decommitted', 'signed', 'enrolled')) = ("recruitment_events"."school_id" is not null or "recruitment_events"."school_name" is not null)),
	CONSTRAINT "recruitment_events_source_url_check" CHECK ("recruitment_events"."source_url" is null or "recruitment_events"."source_url" ~ '^https://')
);
--> statement-breakpoint
CREATE TABLE "recruitments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recruitments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_sport_id" bigint NOT NULL,
	"kind" text DEFAULT 'transfer' NOT NULL,
	"cycle_year" smallint NOT NULL,
	"origin_enrollment_id" bigint,
	"origin_school_id" text,
	"origin_school_name" text,
	"origin_division_id" text,
	"origin_conference_id" text,
	"class_at_entry" text,
	"eligibility_years" smallint,
	"is_grad_transfer" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'entered' NOT NULL,
	"status_at" timestamp with time zone NOT NULL,
	"entered_at" timestamp with time zone NOT NULL,
	"destination_school_id" text,
	"destination_school_name" text,
	"destination_division_id" text,
	"destination_conference_id" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recruitments_kind_check" CHECK ("recruitments"."kind" in ('transfer', 'high_school')),
	CONSTRAINT "recruitments_status_check" CHECK ("recruitments"."status" in ('entered', 'committed', 'signed', 'enrolled', 'withdrawn')),
	CONSTRAINT "recruitments_class_at_entry_check" CHECK ("recruitments"."class_at_entry" is null or "recruitments"."class_at_entry" in ('FR', 'RS-FR', 'SO', 'RS-SO', 'JR', 'RS-JR', 'SR', 'RS-SR', 'GR')),
	CONSTRAINT "recruitments_cycle_year_check" CHECK ("recruitments"."cycle_year" between 2000 and 2100),
	CONSTRAINT "recruitments_eligibility_years_check" CHECK ("recruitments"."eligibility_years" is null or "recruitments"."eligibility_years" between 0 and 6),
	CONSTRAINT "recruitments_closed_check" CHECK (("recruitments"."status" in ('enrolled', 'withdrawn')) = ("recruitments"."closed_at" is not null)),
	CONSTRAINT "recruitments_destination_check" CHECK ("recruitments"."status" not in ('committed', 'signed', 'enrolled') or ("recruitments"."destination_school_id" is not null or "recruitments"."destination_school_name" is not null)),
	CONSTRAINT "recruitments_transfer_origin_check" CHECK ("recruitments"."kind" <> 'transfer' or ("recruitments"."origin_school_id" is not null or "recruitments"."origin_school_name" is not null))
);
--> statement-breakpoint
ALTER TABLE "player_audit_log" ADD CONSTRAINT "player_audit_log_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_audit_log" ADD CONSTRAINT "player_audit_log_actor_user_id_users_table_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_audit_log" ADD CONSTRAINT "player_audit_log_push_id_portal_pushes_id_fk" FOREIGN KEY ("push_id") REFERENCES "public"."portal_pushes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_duplicate_dismissals" ADD CONSTRAINT "player_duplicate_dismissals_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_duplicate_dismissals" ADD CONSTRAINT "player_duplicate_dismissals_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_duplicate_dismissals" ADD CONSTRAINT "player_duplicate_dismissals_dismissed_by_user_id_users_table_id_fk" FOREIGN KEY ("dismissed_by_user_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_enrollments" ADD CONSTRAINT "player_enrollments_player_sport_id_player_sports_id_fk" FOREIGN KEY ("player_sport_id") REFERENCES "public"."player_sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_enrollments" ADD CONSTRAINT "player_enrollments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_enrollments" ADD CONSTRAINT "player_enrollments_via_recruitment_id_recruitments_id_fk" FOREIGN KEY ("via_recruitment_id") REFERENCES "public"."recruitments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_sports" ADD CONSTRAINT "player_sports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_sports" ADD CONSTRAINT "player_sports_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_submissions" ADD CONSTRAINT "player_submissions_matched_player_id_players_id_fk" FOREIGN KEY ("matched_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_submissions" ADD CONSTRAINT "player_submissions_reviewed_by_user_id_users_table_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_merged_into_id_players_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_pushes" ADD CONSTRAINT "portal_pushes_actor_user_id_users_table_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_players" ADD CONSTRAINT "published_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_players" ADD CONSTRAINT "published_players_redirect_to_player_id_players_id_fk" FOREIGN KEY ("redirect_to_player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_players" ADD CONSTRAINT "published_players_push_id_portal_pushes_id_fk" FOREIGN KEY ("push_id") REFERENCES "public"."portal_pushes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_wire_events" ADD CONSTRAINT "published_wire_events_event_id_recruitment_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."recruitment_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_wire_events" ADD CONSTRAINT "published_wire_events_recruitment_id_recruitments_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "public"."recruitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_wire_events" ADD CONSTRAINT "published_wire_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_wire_events" ADD CONSTRAINT "published_wire_events_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_wire_events" ADD CONSTRAINT "published_wire_events_push_id_portal_pushes_id_fk" FOREIGN KEY ("push_id") REFERENCES "public"."portal_pushes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_events" ADD CONSTRAINT "recruitment_events_recruitment_id_recruitments_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "public"."recruitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_events" ADD CONSTRAINT "recruitment_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_events" ADD CONSTRAINT "recruitment_events_created_by_user_id_users_table_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_player_sport_id_player_sports_id_fk" FOREIGN KEY ("player_sport_id") REFERENCES "public"."player_sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_origin_enrollment_id_player_enrollments_id_fk" FOREIGN KEY ("origin_enrollment_id") REFERENCES "public"."player_enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_origin_school_id_schools_id_fk" FOREIGN KEY ("origin_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_origin_division_id_divisions_id_fk" FOREIGN KEY ("origin_division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_origin_conference_id_conferences_id_fk" FOREIGN KEY ("origin_conference_id") REFERENCES "public"."conferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_destination_school_id_schools_id_fk" FOREIGN KEY ("destination_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_destination_division_id_divisions_id_fk" FOREIGN KEY ("destination_division_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_destination_conference_id_conferences_id_fk" FOREIGN KEY ("destination_conference_id") REFERENCES "public"."conferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_audit_log_player_id_created_at_index" ON "player_audit_log" USING btree ("player_id","created_at");--> statement-breakpoint
CREATE INDEX "player_audit_log_unpushed_index" ON "player_audit_log" USING btree ("created_at") WHERE "player_audit_log"."push_id" is null;--> statement-breakpoint
CREATE INDEX "player_audit_log_push_id_index" ON "player_audit_log" USING btree ("push_id");--> statement-breakpoint
CREATE INDEX "player_audit_log_actor_user_id_index" ON "player_audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "player_duplicate_dismissals_player_b_id_index" ON "player_duplicate_dismissals" USING btree ("player_b_id");--> statement-breakpoint
CREATE INDEX "player_duplicate_dismissals_dismissed_by_user_id_index" ON "player_duplicate_dismissals" USING btree ("dismissed_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_enrollments_one_current_per_player_sport" ON "player_enrollments" USING btree ("player_sport_id") WHERE "player_enrollments"."end_year" is null;--> statement-breakpoint
CREATE INDEX "player_enrollments_player_sport_id_index" ON "player_enrollments" USING btree ("player_sport_id");--> statement-breakpoint
CREATE INDEX "player_enrollments_school_id_start_year_index" ON "player_enrollments" USING btree ("school_id","start_year");--> statement-breakpoint
CREATE INDEX "player_enrollments_via_recruitment_id_index" ON "player_enrollments" USING btree ("via_recruitment_id");--> statement-breakpoint
CREATE INDEX "player_sports_sport_id_index" ON "player_sports" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "player_submissions_status_created_at_index" ON "player_submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "player_submissions_matched_player_id_index" ON "player_submissions" USING btree ("matched_player_id");--> statement-breakpoint
CREATE INDEX "player_submissions_reviewed_by_user_id_index" ON "player_submissions" USING btree ("reviewed_by_user_id");--> statement-breakpoint
CREATE INDEX "players_name_search_trgm_index" ON "players" USING gin ("name_search" extensions.gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "players_pending_since_index" ON "players" USING btree ("pending_since") WHERE "players"."pending_since" is not null;--> statement-breakpoint
CREATE INDEX "players_merged_into_id_index" ON "players" USING btree ("merged_into_id") WHERE "players"."merged_into_id" is not null;--> statement-breakpoint
CREATE INDEX "portal_pushes_unrevalidated_index" ON "portal_pushes" USING btree ("committed_at") WHERE "portal_pushes"."revalidated_at" is null;--> statement-breakpoint
CREATE INDEX "portal_pushes_actor_user_id_index" ON "portal_pushes" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "published_players_redirect_to_player_id_index" ON "published_players" USING btree ("redirect_to_player_id");--> statement-breakpoint
CREATE INDEX "published_players_push_id_index" ON "published_players" USING btree ("push_id");--> statement-breakpoint
CREATE INDEX "published_wire_events_wire_index" ON "published_wire_events" USING btree ("sport_id","kind","cycle_year","occurred_at" DESC NULLS FIRST,"event_id" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "published_wire_events_recruitment_id_index" ON "published_wire_events" USING btree ("recruitment_id");--> statement-breakpoint
CREATE INDEX "published_wire_events_player_id_index" ON "published_wire_events" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "published_wire_events_push_id_index" ON "published_wire_events" USING btree ("push_id");--> statement-breakpoint
CREATE INDEX "recruitment_events_recruitment_id_occurred_at_index" ON "recruitment_events" USING btree ("recruitment_id","occurred_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "recruitment_events_one_live_entered" ON "recruitment_events" USING btree ("recruitment_id") WHERE "recruitment_events"."type" = 'entered' and "recruitment_events"."voided_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "recruitment_events_one_live_offer_per_school" ON "recruitment_events" USING btree ("recruitment_id","school_id") WHERE "recruitment_events"."type" = 'offered' and "recruitment_events"."voided_at" is null and "recruitment_events"."school_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "recruitment_events_one_live_offer_per_school_name" ON "recruitment_events" USING btree ("recruitment_id",lower("school_name")) WHERE "recruitment_events"."type" = 'offered' and "recruitment_events"."voided_at" is null and "recruitment_events"."school_id" is null;--> statement-breakpoint
CREATE INDEX "recruitment_events_school_id_index" ON "recruitment_events" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "recruitment_events_created_by_user_id_index" ON "recruitment_events" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recruitments_one_open_per_player_sport" ON "recruitments" USING btree ("player_sport_id") WHERE "recruitments"."closed_at" is null;--> statement-breakpoint
CREATE INDEX "recruitments_player_sport_id_entered_at_index" ON "recruitments" USING btree ("player_sport_id","entered_at");--> statement-breakpoint
CREATE INDEX "recruitments_kind_cycle_year_status_at_index" ON "recruitments" USING btree ("kind","cycle_year","status_at","id");--> statement-breakpoint
CREATE INDEX "recruitments_origin_enrollment_id_index" ON "recruitments" USING btree ("origin_enrollment_id");--> statement-breakpoint
CREATE INDEX "recruitments_origin_school_id_index" ON "recruitments" USING btree ("origin_school_id");--> statement-breakpoint
CREATE INDEX "recruitments_origin_division_id_index" ON "recruitments" USING btree ("origin_division_id");--> statement-breakpoint
CREATE INDEX "recruitments_origin_conference_id_index" ON "recruitments" USING btree ("origin_conference_id");--> statement-breakpoint
CREATE INDEX "recruitments_destination_school_id_index" ON "recruitments" USING btree ("destination_school_id");--> statement-breakpoint
CREATE INDEX "recruitments_destination_division_id_index" ON "recruitments" USING btree ("destination_division_id");--> statement-breakpoint
CREATE INDEX "recruitments_destination_conference_id_index" ON "recruitments" USING btree ("destination_conference_id");--> statement-breakpoint
-- Same model as 0020: Drizzle connects with a privileged role and Clerk handles
-- auth, so RLS is on with no policies and the Data API roles get nothing.
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "player_sports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "player_enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recruitments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recruitment_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "player_duplicate_dismissals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "portal_pushes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "player_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "published_players" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "published_wire_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "player_submissions" ENABLE ROW LEVEL SECURITY;
