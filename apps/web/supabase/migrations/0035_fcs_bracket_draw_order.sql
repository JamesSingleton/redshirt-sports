-- Draw the FCS bracket in the NCAA's order: the 5 above the 4 and the 6
-- above the 3. `sideBOnTop` only changes the drawing, so stored scores and
-- reader picks (keyed by side a/b) keep their meaning.
UPDATE "bracket_formats"
SET "spec" = jsonb_set(
  "spec",
  '{games}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN "game"->>'key' IN ('qf-3', 'qf-4')
          THEN "game" || '{"sideBOnTop": true}'::jsonb
        ELSE "game"
      END
      ORDER BY "position"
    )
    FROM jsonb_array_elements("spec"->'games') WITH ORDINALITY AS "games"("game", "position")
  )
)
WHERE "key" = 'fcs-24-seed16-v2024';
