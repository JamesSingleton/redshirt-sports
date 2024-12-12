ALTER TABLE "school_references" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" DROP COLUMN IF EXISTS "eligibility_years";