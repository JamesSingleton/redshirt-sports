CREATE TABLE "season_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"season_id" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "season_types_season_id_type_unique" UNIQUE("season_id","type")
);
--> statement-breakpoint
ALTER TABLE "seasons" RENAME COLUMN "start" TO "start_date";--> statement-breakpoint
ALTER TABLE "seasons" RENAME COLUMN "end" TO "end_date";--> statement-breakpoint
ALTER TABLE "weeks" RENAME COLUMN "week" TO "number";--> statement-breakpoint
ALTER TABLE "weeks" RENAME COLUMN "start" TO "start_date";--> statement-breakpoint
ALTER TABLE "weeks" RENAME COLUMN "end" TO "end_date";--> statement-breakpoint
ALTER TABLE "weeks" RENAME COLUMN "seasonId" TO "season_type_id";--> statement-breakpoint
ALTER TABLE "seasons" DROP CONSTRAINT "seasons_year_unique";--> statement-breakpoint
ALTER TABLE "weeks" DROP CONSTRAINT "weeks_seasonId_week_unique";--> statement-breakpoint
ALTER TABLE "weeks" DROP CONSTRAINT "weeks_seasonId_seasons_id_fk";
--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "display_name" varchar(256);--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "sport_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "weeks" ADD COLUMN "text" varchar(256);--> statement-breakpoint
ALTER TABLE "weeks" ADD COLUMN "created_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "weeks" ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "season_types" ADD CONSTRAINT "season_types_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_season_type_id_season_types_id_fk" FOREIGN KEY ("season_type_id") REFERENCES "public"."season_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_sport_id_year_unique" UNIQUE("sport_id","year");--> statement-breakpoint
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_season_type_id_number_unique" UNIQUE("season_type_id","number");