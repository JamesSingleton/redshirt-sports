ALTER TABLE "transfer_portal_entries" DROP CONSTRAINT "transfer_portal_entries_class_year_class_years_id_fk";
--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" DROP COLUMN IF EXISTS "class_year";