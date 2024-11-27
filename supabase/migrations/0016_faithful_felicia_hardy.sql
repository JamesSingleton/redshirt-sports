ALTER TABLE "transfer_portal_entries" RENAME COLUMN "class_year" TO "class_year_id";--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" DROP CONSTRAINT "transfer_portal_entries_class_year_class_years_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transfer_portal_entries" ADD CONSTRAINT "transfer_portal_entries_class_year_id_class_years_id_fk" FOREIGN KEY ("class_year_id") REFERENCES "public"."class_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
