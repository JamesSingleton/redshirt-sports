ALTER TABLE "schools" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_slug_unique" UNIQUE("slug");
