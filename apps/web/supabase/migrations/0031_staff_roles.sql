ALTER TABLE "users_table" ADD COLUMN "roles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ADD CONSTRAINT "users_table_roles_check" CHECK ("users_table"."roles" <@ array['admin', 'portal', 'ballots']::text[]);--> statement-breakpoint
-- Existing admins keep admin as a role, so the Staff page lists them.
UPDATE "users_table" SET "roles" = ARRAY['admin']::text[] WHERE "isAdmin";
