CREATE TABLE "conferences" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"sanity_id" text,
	"division_id" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "conferences_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"sanity_id" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "divisions_sanity_id_unique" UNIQUE("sanity_id")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"sanity_id" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "schools_sanity_id_unique" UNIQUE("sanity_id")
);
