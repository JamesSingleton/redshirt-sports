CREATE TABLE "high_schools" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"slug" varchar(255) NOT NULL,
	"full_name" text NOT NULL,
	"short_name" text,
	"city" text,
	"state" varchar(50),
	"primary_color" varchar(7),
	CONSTRAINT "high_schools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "player_commitments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"school_id" text,
	"sport_id" text,
	"committed_at" timestamp,
	"class_year" integer
);
--> statement-breakpoint
CREATE TABLE "player_organization_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"school_id" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer,
	"is_transfer" boolean DEFAULT false NOT NULL,
	CONSTRAINT "player_organization_history_player_id_school_id_start_year_unique" UNIQUE("player_id","school_id","start_year")
);
--> statement-breakpoint
CREATE TABLE "player_timeline" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"label" text NOT NULL,
	"school_id" text,
	"sport_id" text,
	"start_date" timestamp,
	"end_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"slug" varchar(200) NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"display_name" text,
	"sport_id" text,
	"position" varchar(50),
	"class_year" integer,
	"height_inches" integer,
	"weight_lbs" integer,
	"headshot_url" text,
	"hometown" text,
	"high_school" text,
	"high_school_id" text,
	"last_school_id" text,
	"current_status" varchar(32),
	"committed_school_id" text,
	"bio" text,
	"social_links" jsonb,
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transfer_portal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"status" varchar(32) NOT NULL,
	"portal_year" integer NOT NULL,
	"from_school_id" text NOT NULL,
	"to_school_id" text,
	"entered_at" timestamp,
	"committed_at" timestamp,
	"signed_at" timestamp,
	"enrolled_at" timestamp,
	"withdrawn_at" timestamp,
	"class_rank" varchar(50),
	"is_short_term_signee" boolean DEFAULT false,
	"is_withdrawn_transfer" boolean DEFAULT false,
	"sort_order" integer,
	"event_date" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_commitments" ADD CONSTRAINT "player_commitments_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_commitments" ADD CONSTRAINT "player_commitments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_commitments" ADD CONSTRAINT "player_commitments_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_organization_history" ADD CONSTRAINT "player_organization_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_organization_history" ADD CONSTRAINT "player_organization_history_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_timeline" ADD CONSTRAINT "player_timeline_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_timeline" ADD CONSTRAINT "player_timeline_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_timeline" ADD CONSTRAINT "player_timeline_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_high_school_id_high_schools_id_fk" FOREIGN KEY ("high_school_id") REFERENCES "public"."high_schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_last_school_id_schools_id_fk" FOREIGN KEY ("last_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_committed_school_id_schools_id_fk" FOREIGN KEY ("committed_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_from_school_id_schools_id_fk" FOREIGN KEY ("from_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_to_school_id_schools_id_fk" FOREIGN KEY ("to_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "high_schools_slug_index" ON "high_schools" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "high_schools_state_index" ON "high_schools" USING btree ("state");--> statement-breakpoint
CREATE INDEX "player_commitments_player_id_index" ON "player_commitments" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_commitments_school_id_index" ON "player_commitments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "player_organization_history_player_id_index" ON "player_organization_history" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_organization_history_school_id_index" ON "player_organization_history" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "player_timeline_player_id_index" ON "player_timeline" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "players_slug_index" ON "players" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "players_sport_id_index" ON "players" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_player_id_index" ON "transfer_portal_entries" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_status_index" ON "transfer_portal_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_portal_year_index" ON "transfer_portal_entries" USING btree ("portal_year");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_from_school_id_index" ON "transfer_portal_entries" USING btree ("from_school_id");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_to_school_id_index" ON "transfer_portal_entries" USING btree ("to_school_id");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_portal_year_event_date_index" ON "transfer_portal_entries" USING btree ("portal_year","event_date");