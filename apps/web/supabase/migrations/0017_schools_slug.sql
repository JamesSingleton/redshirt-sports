ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'schools_slug_unique'
    and conrelid = 'public.schools'::regclass
  ) then
    alter table "schools" add constraint "schools_slug_unique" unique("slug");
  end if;
end $$;
