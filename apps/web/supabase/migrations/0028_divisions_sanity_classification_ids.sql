-- Sanity's `division` documents are retired in favour of `classification`
-- documents (see apps/studio/migrations/editorial-01-division-to-classification).
-- The `divisions` rows for whole levels keep their primary keys, slugs and
-- everything that hangs off them (conferences, polls, rating pools); only the
-- Sanity id they sync from changes. Without this, the admin "load divisions"
-- action would insert duplicate rows instead of updating these.
--
-- Subdivision rows (FBS, FCS, Mid-Major, Power Conferences) sync from
-- `sportSubgrouping` documents and are untouched.
UPDATE "divisions" AS d
SET "sanity_id" = m.classification_id
FROM (
  VALUES
    ('329c4f4f-bb7c-459e-872d-eb1a57deb196', '1574eb35-c770-4cd4-a164-444045196cc9'), -- d1   → NCAA Division I
    ('e2d80115-770a-40e0-b282-45cd308c1c17', '54859748-a58b-4e76-90db-47dacca602cf'), -- d2   → NCAA Division II
    ('b029512a-f43a-4c62-8b51-aa6732f5943d', '404f490e-c922-413f-ab85-f21e9e47d5ee'), -- d3   → NCAA Division III
    ('7545e7a6-899f-4188-9e31-4d254b4bac61', 'cdba8271-8834-4a52-8b81-04b373833688')  -- naia → NAIA
) AS m(division_id, classification_id)
WHERE d."sanity_id" = m.division_id
  AND NOT EXISTS (
    SELECT 1 FROM "divisions" AS existing
    WHERE existing."sanity_id" = m.classification_id
  );
