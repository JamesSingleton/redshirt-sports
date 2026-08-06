-- Post-cutover cleanup ONLY.
-- Run manually after published rankings and ballots have been verified.
-- Do not apply via automatic migrate.

DROP TABLE IF EXISTS "voter_ballot";
DROP TABLE IF EXISTS "weekly_final_rankings";
