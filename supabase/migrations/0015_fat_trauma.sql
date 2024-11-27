ALTER TABLE "transfer_portal_entries" ADD COLUMN "class_year" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_class_year_class_years_id_fk" FOREIGN KEY ("class_year") REFERENCES "public"."class_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
