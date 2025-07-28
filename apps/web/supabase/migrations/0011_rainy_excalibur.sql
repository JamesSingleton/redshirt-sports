CREATE TABLE "sports" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(256) NOT NULL,
	"display_name" varchar(256),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "sports_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "voter_ballot" RENAME COLUMN "sport" TO "sport_id";--> statement-breakpoint
ALTER TABLE "weekly_final_rankings" RENAME COLUMN "sport" TO "sport_id";--> statement-breakpoint
ALTER TABLE "voter_ballot" ADD CONSTRAINT "voter_ballot_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_final_rankings" ADD CONSTRAINT "weekly_final_rankings_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;