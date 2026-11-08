-- Narrow the FCS pool's cron windows to match the three ratings schedules in
-- apps/web/vercel.json: Sunday at midnight Pacific and 6 a.m. Eastern, and
-- Tuesday at 6 a.m. Eastern for Monday games. The schedules run in local time,
-- so each window spans both the daylight and standard UTC offsets:
-- Sunday 07:00-12:00 UTC and Tuesday 10:00-12:00 UTC.
UPDATE "rating_pools"
SET "schedule" = jsonb_set(
  "schedule",
  '{windows}',
  '[{"day":0,"startHour":7,"endHour":12},{"day":2,"startHour":10,"endHour":12}]'::jsonb
)
WHERE "slug" = 'fcs'
AND "sport_id" = (SELECT "id" FROM "sports" WHERE "slug" = 'football');
