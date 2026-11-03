-- Reworks the 0023 bracket tables before anything writes to them:
-- structure lives only in bracket_formats.spec; slots and games hold state.
-- bracket_divisions folds into bracket_formats.division_slug.
-- Stops instead of dropping columns if any edition already exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "bracket_editions") THEN
    RAISE EXCEPTION 'bracket_editions has rows; 0026 expects empty bracket tables';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "bracket_formats" ADD COLUMN "division_slug" text;--> statement-breakpoint
UPDATE "bracket_formats" "format"
SET "division_slug" = "division"."slug"
FROM "bracket_divisions" "division"
WHERE "division"."id" = "format"."division_id";--> statement-breakpoint
ALTER TABLE "bracket_editions" DROP CONSTRAINT "bracket_editions_status_check";--> statement-breakpoint
ALTER TABLE "bracket_editions" DROP CONSTRAINT "bracket_editions_source_week_id_weeks_id_fk";
--> statement-breakpoint
ALTER TABLE "bracket_editions" DROP CONSTRAINT "bracket_editions_cloned_from_edition_id_fk";
--> statement-breakpoint
ALTER TABLE "bracket_formats" DROP CONSTRAINT "bracket_formats_division_id_bracket_divisions_id_fk";
--> statement-breakpoint
DROP TABLE "bracket_divisions";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP CONSTRAINT "bracket_games_winner_school_id_schools_id_fk";
--> statement-breakpoint
DROP INDEX "bracket_editions_projection_identity";--> statement-breakpoint
DROP INDEX "bracket_editions_official_draft";--> statement-breakpoint
DROP INDEX "bracket_editions_official_published";--> statement-breakpoint
DROP INDEX "bracket_editions_source_week_id_index";--> statement-breakpoint
DROP INDEX "bracket_editions_cloned_from_edition_id_index";--> statement-breakpoint
DROP INDEX "bracket_formats_sport_id_index";--> statement-breakpoint
DROP INDEX "bracket_formats_division_id_index";--> statement-breakpoint
DROP INDEX "bracket_games_winner_school_id_index";--> statement-breakpoint
DROP INDEX "bracket_slots_edition_school";--> statement-breakpoint
ALTER TABLE "bracket_editions" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "bracket_slots" ALTER COLUMN "school_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bracket_editions" ADD COLUMN "week_id" text;--> statement-breakpoint
ALTER TABLE "bracket_games" ADD COLUMN "kickoff_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bracket_games" ADD COLUMN "side_a_score" integer;--> statement-breakpoint
ALTER TABLE "bracket_games" ADD COLUMN "side_b_score" integer;--> statement-breakpoint
ALTER TABLE "bracket_games" ADD COLUMN "winner_side" text;--> statement-breakpoint
ALTER TABLE "bracket_games" ADD COLUMN "game_id" text;--> statement-breakpoint
ALTER TABLE "bracket_editions" ADD CONSTRAINT "bracket_editions_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_games" ADD CONSTRAINT "bracket_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bracket_editions_week_id_index" ON "bracket_editions" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "bracket_games_game_id_index" ON "bracket_games" USING btree ("game_id");--> statement-breakpoint
ALTER TABLE "bracket_editions" DROP COLUMN "source_week_id";--> statement-breakpoint
ALTER TABLE "bracket_editions" DROP COLUMN "revision";--> statement-breakpoint
ALTER TABLE "bracket_editions" DROP COLUMN "cloned_from_edition_id";--> statement-breakpoint
ALTER TABLE "bracket_formats" DROP COLUMN "division_id";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "round_key";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "round_label";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "side_a_slot_key";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "side_b_slot_key";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "side_a_from_game_key";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "side_b_from_game_key";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "winner_school_id";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "home_score";--> statement-breakpoint
ALTER TABLE "bracket_games" DROP COLUMN "away_score";--> statement-breakpoint
ALTER TABLE "bracket_slots" DROP COLUMN "seed";--> statement-breakpoint
ALTER TABLE "bracket_slots" DROP COLUMN "region";--> statement-breakpoint
ALTER TABLE "bracket_slots" DROP COLUMN "show_seed";--> statement-breakpoint
ALTER TABLE "bracket_editions" ADD CONSTRAINT "bracket_editions_identity_unique" UNIQUE NULLS NOT DISTINCT("format_id","season_id","kind","week_id");--> statement-breakpoint
ALTER TABLE "bracket_formats" ADD CONSTRAINT "bracket_formats_sport_division_from_year_unique" UNIQUE NULLS NOT DISTINCT("sport_id","division_slug","effective_from_year");--> statement-breakpoint
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_edition_id_school_id_unique" UNIQUE("edition_id","school_id");--> statement-breakpoint
ALTER TABLE "bracket_editions" ADD CONSTRAINT "bracket_editions_week_check" CHECK (("bracket_editions"."kind" = 'projection') = ("bracket_editions"."week_id" is not null));--> statement-breakpoint
ALTER TABLE "bracket_editions" ADD CONSTRAINT "bracket_editions_published_at_check" CHECK ("bracket_editions"."status" <> 'published' or "bracket_editions"."published_at" is not null);--> statement-breakpoint
ALTER TABLE "bracket_editions" ADD CONSTRAINT "bracket_editions_status_check" CHECK ("bracket_editions"."status" in ('draft', 'published'));--> statement-breakpoint
ALTER TABLE "bracket_games" ADD CONSTRAINT "bracket_games_winner_side_check" CHECK ("bracket_games"."winner_side" is null or "bracket_games"."winner_side" in ('a', 'b'));--> statement-breakpoint
ALTER TABLE "bracket_games" ADD CONSTRAINT "bracket_games_final_winner_check" CHECK (("bracket_games"."status" = 'final') = ("bracket_games"."winner_side" is not null));--> statement-breakpoint
ALTER TABLE "bracket_games" ADD CONSTRAINT "bracket_games_scores_check" CHECK (("bracket_games"."side_a_score" is null or "bracket_games"."side_a_score" >= 0) and ("bracket_games"."side_b_score" is null or "bracket_games"."side_b_score" >= 0));
