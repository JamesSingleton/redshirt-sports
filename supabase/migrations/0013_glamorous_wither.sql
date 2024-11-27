CREATE TABLE IF NOT EXISTS "class_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" varchar(10) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ALTER COLUMN "class_year" SET DATA TYPE integer;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_year_name_idx" ON "class_years" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "class_year_abbreviation_idx" ON "class_years" USING btree ("abbreviation");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_class_year_class_years_id_fk" FOREIGN KEY ("class_year") REFERENCES "public"."class_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
