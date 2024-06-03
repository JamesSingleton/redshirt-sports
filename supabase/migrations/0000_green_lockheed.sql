CREATE TABLE IF NOT EXISTS "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(256) NOT NULL,
	"teamId" varchar(256) NOT NULL,
	"rank" integer NOT NULL,
	"week" integer NOT NULL,
	"year" integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp
);
