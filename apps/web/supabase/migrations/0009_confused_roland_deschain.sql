ALTER TABLE "voter_ballot" ADD COLUMN "sport" varchar(256);--> statement-breakpoint
ALTER TABLE "weekly_final_rankings" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP;