CREATE TABLE IF NOT EXISTS "weekly_final_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"division" varchar(10) NOT NULL,
	"week" integer NOT NULL,
	"year" integer NOT NULL,
	"rankings" jsonb NOT NULL
);
--> statement-breakpoint
DROP TABLE "ballots";