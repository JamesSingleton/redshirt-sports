-- Sanity's `division` documents are retired in favour of `classification`
-- documents (see apps/studio/migrations/editorial-01-division-to-classification).
-- The `divisions` rows for whole levels keep their primary keys, slugs and
-- everything that hangs off them (conferences, polls, rating pools); only the
-- Sanity id they sync from changes. Without this, the admin "load divisions"
-- action would insert duplicate rows instead of updating these.
--
-- Subdivision rows (FBS, FCS, Mid-Major, Power Conferences) sync from
-- `sportSubgrouping` documents and are untouched.
--
-- The ids are production's. A database without these rows (a fresh local one)
-- passes untouched; one whose d1/d2/d3/naia rows point anywhere else after the
-- update fails, so a mismatch can't slip through silently.
DO $$
DECLARE
  mismatched text;
BEGIN
  CREATE TEMP TABLE division_id_map (
    slug text,
    division_id text,
    classification_id text
  ) ON COMMIT DROP;

  INSERT INTO division_id_map VALUES
    ('d1',   '329c4f4f-bb7c-459e-872d-eb1a57deb196', '1574eb35-c770-4cd4-a164-444045196cc9'), -- NCAA Division I
    ('d2',   'e2d80115-770a-40e0-b282-45cd308c1c17', '54859748-a58b-4e76-90db-47dacca602cf'), -- NCAA Division II
    ('d3',   'b029512a-f43a-4c62-8b51-aa6732f5943d', '404f490e-c922-413f-ab85-f21e9e47d5ee'), -- NCAA Division III
    ('naia', '7545e7a6-899f-4188-9e31-4d254b4bac61', 'cdba8271-8834-4a52-8b81-04b373833688'); -- NAIA

  UPDATE "divisions" AS d
  SET "sanity_id" = m.classification_id
  FROM division_id_map AS m
  WHERE d."sanity_id" = m.division_id
    AND NOT EXISTS (
      SELECT 1 FROM "divisions" AS existing
      WHERE existing."sanity_id" = m.classification_id
    );

  SELECT string_agg(
    format('%s (id %s, sanity_id %s)', d."slug", d."id", coalesce(d."sanity_id", 'null')),
    ', '
  )
  INTO mismatched
  FROM "divisions" AS d
  JOIN division_id_map AS m ON m.slug = d."slug"
  WHERE coalesce(d."is_subdivision", false) = false
    AND d."sanity_id" IS DISTINCT FROM m.classification_id;

  IF mismatched IS NOT NULL THEN
    RAISE EXCEPTION
      'divisions rows not synced from their Sanity classification: %. Fix the ids in this migration or the rows, then rerun.',
      mismatched;
  END IF;
END $$;
