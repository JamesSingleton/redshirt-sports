CREATE TYPE "public"."academic_year" AS ENUM('FR', 'SO', 'JR', 'SR', 'GR');--> statement-breakpoint
CREATE TYPE "public"."portal_status" AS ENUM('ENTERED', 'COMMITTED', 'SIGNED', 'ENROLLED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "high_schools" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"name" text NOT NULL,
	"city" text,
	"state" varchar(2),
	CONSTRAINT "high_schools_name_city_state_unique" UNIQUE("name","city","state")
);
--> statement-breakpoint
ALTER TABLE "high_schools" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "player_school_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"school_id" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer,
	CONSTRAINT "player_school_history_player_id_school_id_start_year_unique" UNIQUE("player_id","school_id","start_year")
);
--> statement-breakpoint
ALTER TABLE "player_school_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"slug" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"position" varchar(10) NOT NULL,
	"height_inches" integer,
	"weight_lbs" integer,
	"academic_year" "academic_year",
	"is_redshirt" boolean DEFAULT false NOT NULL,
	"hometown" text,
	"high_school_id" text,
	"sport_id" text NOT NULL,
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "transfer_portal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"sport_id" text NOT NULL,
	"portal_year" integer NOT NULL,
	"status" "portal_status" DEFAULT 'ENTERED' NOT NULL,
	"from_school_id" text NOT NULL,
	"to_school_id" text,
	"entered_at" timestamp with time zone NOT NULL,
	"committed_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"enrolled_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"event_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "player_school_history" ADD CONSTRAINT "player_school_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_school_history" ADD CONSTRAINT "player_school_history_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_high_school_id_high_schools_id_fk" FOREIGN KEY ("high_school_id") REFERENCES "public"."high_schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_from_school_id_schools_id_fk" FOREIGN KEY ("from_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_to_school_id_schools_id_fk" FOREIGN KEY ("to_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_school_history_school_id_index" ON "player_school_history" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "players_sport_id_index" ON "players" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "players_high_school_id_index" ON "players" USING btree ("high_school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_portal_entries_player_id_portal_year_index" ON "transfer_portal_entries" USING btree ("player_id","portal_year");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_wire_cursor_index" ON "transfer_portal_entries" USING btree ("sport_id","portal_year","event_date" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_sport_id_portal_year_status_index" ON "transfer_portal_entries" USING btree ("sport_id","portal_year","status");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_from_school_id_index" ON "transfer_portal_entries" USING btree ("from_school_id");--> statement-breakpoint
CREATE INDEX "transfer_portal_entries_to_school_id_index" ON "transfer_portal_entries" USING btree ("to_school_id");