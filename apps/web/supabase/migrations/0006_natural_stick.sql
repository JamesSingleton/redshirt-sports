CREATE TABLE IF NOT EXISTS "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	CONSTRAINT "seasons_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"seasonId" integer NOT NULL,
	"week" integer NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	CONSTRAINT "weeks_seasonId_week_unique" UNIQUE("seasonId","week")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weeks" ADD CONSTRAINT "weeks_seasonId_seasons_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
