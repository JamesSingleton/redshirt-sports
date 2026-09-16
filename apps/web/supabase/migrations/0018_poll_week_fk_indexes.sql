CREATE INDEX "ballots_week_id_index" ON "ballots" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "poll_rankings_week_id_index" ON "poll_rankings" USING btree ("week_id");