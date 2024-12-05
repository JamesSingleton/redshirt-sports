CREATE TABLE IF NOT EXISTS "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"height" integer,
	"weight" integer,
	"high_school" text,
	"hometown" text,
	"state" text,
	"player_image_url" text,
	"instagram_handle" varchar(30),
	"twitter_handle" varchar(30),
	"position_id" integer,
	"current_school_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"sanity_id" text NOT NULL,
	CONSTRAINT "school_references_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfer_portal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"year" integer NOT NULL,
	"entry_date" date NOT NULL,
	"eligibility_years" integer,
	"is_grad_transfer" boolean DEFAULT false NOT NULL,
	"previous_school_id" integer,
	"commitment_school_id" integer,
	"commitment_date" date
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "players" ADD CONSTRAINT "players_current_school_id_school_references_id_fk" FOREIGN KEY ("current_school_id") REFERENCES "public"."school_references"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_previous_school_id_school_references_id_fk" FOREIGN KEY ("previous_school_id") REFERENCES "public"."school_references"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_commitment_school_id_school_references_id_fk" FOREIGN KEY ("commitment_school_id") REFERENCES "public"."school_references"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sanity_id_idx" ON "school_references" USING btree ("sanity_id");