CREATE TABLE IF NOT EXISTS "voter_ballot" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(256) NOT NULL,
	"division" varchar(10) NOT NULL,
	"week" integer NOT NULL,
	"year" integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"team_id" varchar(256) NOT NULL,
	"rank" integer NOT NULL,
	"points" integer NOT NULL
);
