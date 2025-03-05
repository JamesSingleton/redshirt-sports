CREATE TABLE IF NOT EXISTS "users_table" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"mediaAffiliation" text
);
--> statement-breakpoint
ALTER TABLE "weekly_final_rankings" ADD CONSTRAINT "weekly_final_rankings_year_week_unique" UNIQUE("year","week");