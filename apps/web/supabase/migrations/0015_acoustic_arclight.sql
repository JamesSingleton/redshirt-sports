CREATE TABLE "weekly_team_rankings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"school_id" text NOT NULL,
	"division_sport_id" text,
	"week_id" text NOT NULL,
	"ranking" integer,
	"points" integer,
	"first_place_votes" integer,
	"is_tie" boolean,
	CONSTRAINT "weekly_team_rankings_division_sport_id_school_id_week_id_unique" UNIQUE("division_sport_id","school_id","week_id")
);
