CREATE TABLE "conference_sports" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"conference_id" text NOT NULL,
	"sport_id" text NOT NULL,
	CONSTRAINT "conference_sports_conference_id_sport_id_unique" UNIQUE("conference_id","sport_id")
);
--> statement-breakpoint
CREATE TABLE "conferences" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"name" text,
	"sanity_id" text,
	"division_id" text,
	"short_name" text,
	"abbreviation" text,
	"slug" text,
	"logo" jsonb,
	CONSTRAINT "conferences_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"name" text,
	"title" text,
	"heading" text,
	"long_name" text,
	"sanity_id" text,
	"slug" text,
	"description" text,
	"logo" jsonb,
	CONSTRAINT "divisions_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE TABLE "school_conference_affiliations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"school_id" text NOT NULL,
	"sport_id" text NOT NULL,
	"conference_id" text NOT NULL,
	CONSTRAINT "school_conference_affiliations_school_id_sport_id_conference_id_unique" UNIQUE("school_id","sport_id","conference_id")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"name" text,
	"sanity_id" text,
	"short_name" text,
	"abbreviation" text,
	"nickname" text,
	"image" jsonb,
	"top_25_eligible" boolean,
	CONSTRAINT "schools_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE TABLE "subdivision_sports" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"sport_id" text NOT NULL,
	"subdivision_id" text NOT NULL,
	CONSTRAINT "subdivision_sports_sport_id_subdivision_id_unique" UNIQUE("sport_id","subdivision_id")
);
--> statement-breakpoint
CREATE TABLE "subdivisions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"name" text,
	"division_id" text,
	"short_name" text,
	"slug" text,
	"sanity_id" text,
	CONSTRAINT "subdivisions_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE INDEX "conferences_sanity_id_index" ON "conferences" USING btree ("sanity_id");--> statement-breakpoint
CREATE INDEX "divisions_sanity_id_index" ON "divisions" USING btree ("sanity_id");--> statement-breakpoint
CREATE INDEX "schools_sanity_id_index" ON "schools" USING btree ("sanity_id");--> statement-breakpoint
CREATE INDEX "subdivisions_sanity_id_index" ON "subdivisions" USING btree ("sanity_id");