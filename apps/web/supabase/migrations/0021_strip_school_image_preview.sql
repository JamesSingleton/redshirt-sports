-- Drop Sanity LQIP data URIs from schools.image.
-- Browsers cannot cache `data:` previews; they were ~80% of the jsonb payload
-- and of rankings-page Postgres egress.

UPDATE schools
SET image = image - 'preview'
WHERE image IS NOT NULL
  AND image ? 'preview';
