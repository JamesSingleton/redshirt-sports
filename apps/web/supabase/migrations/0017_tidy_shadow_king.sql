CREATE TABLE "recruiting_rankings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"player_id" text NOT NULL,
	"sport_id" text NOT NULL,
	"class_year" integer NOT NULL,
	"national_rank" integer,
	"position_rank" integer,
	"state_rank" integer,
	"stars" integer,
	"composite_score" integer,
	"position" varchar(50),
	"state" varchar(50),
	CONSTRAINT "recruiting_rankings_player_id_sport_id_class_year_unique" UNIQUE("player_id","sport_id","class_year")
);
--> statement-breakpoint
CREATE TABLE "voter_poll_assignments" (
	"user_id" text NOT NULL,
	"sport_id" text NOT NULL,
	"division" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "voter_poll_assignments_user_id_sport_id_division_pk" PRIMARY KEY("user_id","sport_id","division")
);
--> statement-breakpoint
ALTER TABLE "weekly_final_rankings" DROP CONSTRAINT "weekly_final_rankings_division_year_week_unique";--> statement-breakpoint
ALTER TABLE "recruiting_rankings" ADD CONSTRAINT "recruiting_rankings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiting_rankings" ADD CONSTRAINT "recruiting_rankings_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_poll_assignments" ADD CONSTRAINT "voter_poll_assignments_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_poll_assignments" ADD CONSTRAINT "voter_poll_assignments_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recruiting_rankings_sport_class_national_idx" ON "recruiting_rankings" USING btree ("sport_id","class_year","national_rank");--> statement-breakpoint
CREATE INDEX "voter_poll_assignments_user_id_idx" ON "voter_poll_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "voter_poll_assignments_sport_division_idx" ON "voter_poll_assignments" USING btree ("sport_id","division");--> statement-breakpoint
CREATE INDEX "voter_ballot_week_idx" ON "voter_ballot" USING btree ("year","week","division","sport_id");--> statement-breakpoint
CREATE INDEX "voter_ballot_user_week_idx" ON "voter_ballot" USING btree ("userId","year","week","division","sport_id");--> statement-breakpoint
CREATE INDEX "weekly_final_rankings_sport_id_idx" ON "weekly_final_rankings" USING btree ("sport_id");--> statement-breakpoint
ALTER TABLE "weekly_final_rankings" ADD CONSTRAINT "weekly_final_rankings_division_year_week_sport_id_unique" UNIQUE("division","year","week","sport_id");