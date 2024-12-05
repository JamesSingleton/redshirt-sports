ALTER TABLE "transfer_portal_entries" ALTER COLUMN "previous_school_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transfer_portal_entries" ADD COLUMN "class_year" varchar(10);