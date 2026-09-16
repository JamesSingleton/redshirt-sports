CREATE INDEX "polls_division_sport_id_index" ON "polls" USING btree ("division_sport_id");--> statement-breakpoint
CREATE INDEX "voter_ballot_sport_id_index" ON "voter_ballot" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "weekly_final_rankings_sport_id_index" ON "weekly_final_rankings" USING btree ("sport_id");