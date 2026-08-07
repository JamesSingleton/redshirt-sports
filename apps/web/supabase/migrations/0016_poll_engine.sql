CREATE TABLE "polls" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"sport_id" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"division_sport_id" text,
	CONSTRAINT "polls_sport_id_slug_unique" UNIQUE("sport_id","slug")
);
--> statement-breakpoint
CREATE TABLE "poll_voters" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"poll_id" text NOT NULL,
	"user_id" text NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "poll_voters_poll_id_user_id_unique" UNIQUE("poll_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "ballots" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"poll_id" text NOT NULL,
	"user_id" text NOT NULL,
	"week_id" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "ballots_poll_id_user_id_week_id_unique" UNIQUE("poll_id","user_id","week_id")
);
--> statement-breakpoint
CREATE TABLE "ballot_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"ballot_id" text NOT NULL,
	"school_id" text NOT NULL,
	"rank" integer NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "ballot_entries_ballot_id_rank_unique" UNIQUE("ballot_id","rank"),
	CONSTRAINT "ballot_entries_ballot_id_school_id_unique" UNIQUE("ballot_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "poll_rankings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"poll_id" text NOT NULL,
	"week_id" text NOT NULL,
	"school_id" text NOT NULL,
	"rank" integer,
	"points" integer NOT NULL,
	"first_place_votes" integer DEFAULT 0 NOT NULL,
	"is_tie" boolean DEFAULT false NOT NULL,
	CONSTRAINT "poll_rankings_poll_id_week_id_school_id_unique" UNIQUE("poll_id","week_id","school_id")
);
--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_division_sport_id_division_sports_id_fk" FOREIGN KEY ("division_sport_id") REFERENCES "public"."division_sports"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "poll_voters" ADD CONSTRAINT "poll_voters_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "poll_voters" ADD CONSTRAINT "poll_voters_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ballot_entries" ADD CONSTRAINT "ballot_entries_ballot_id_ballots_id_fk" FOREIGN KEY ("ballot_id") REFERENCES "public"."ballots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ballot_entries" ADD CONSTRAINT "ballot_entries_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "poll_rankings" ADD CONSTRAINT "poll_rankings_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "poll_rankings" ADD CONSTRAINT "poll_rankings_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "poll_rankings" ADD CONSTRAINT "poll_rankings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "polls_slug_index" ON "polls" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "poll_voters_user_id_index" ON "poll_voters" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "poll_voters_poll_id_index" ON "poll_voters" USING btree ("poll_id");
--> statement-breakpoint
CREATE INDEX "ballots_poll_id_week_id_index" ON "ballots" USING btree ("poll_id","week_id");
--> statement-breakpoint
CREATE INDEX "ballots_user_id_poll_id_index" ON "ballots" USING btree ("user_id","poll_id");
--> statement-breakpoint
CREATE INDEX "ballot_entries_ballot_id_index" ON "ballot_entries" USING btree ("ballot_id");
--> statement-breakpoint
CREATE INDEX "ballot_entries_school_id_index" ON "ballot_entries" USING btree ("school_id");
--> statement-breakpoint
CREATE INDEX "poll_rankings_poll_id_week_id_index" ON "poll_rankings" USING btree ("poll_id","week_id");
--> statement-breakpoint
CREATE INDEX "poll_rankings_school_id_poll_id_week_id_index" ON "poll_rankings" USING btree ("school_id","poll_id","week_id");
--> statement-breakpoint
ALTER TABLE "polls" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "poll_voters" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ballots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ballot_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "poll_rankings" ENABLE ROW LEVEL SECURITY;
