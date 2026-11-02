CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"season_id" text NOT NULL,
	"week_id" text,
	"season_type" integer NOT NULL,
	"home_school_id" text,
	"away_school_id" text,
	"home_external_id" text,
	"away_external_id" text,
	"home_name" text NOT NULL,
	"away_name" text NOT NULL,
	"home_short_name" text,
	"away_short_name" text,
	"home_level" text,
	"away_level" text,
	"home_score" integer,
	"away_score" integer,
	"neutral_site" boolean DEFAULT false NOT NULL,
	"overtime" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"kickoff_at" timestamp with time zone,
	"source" text NOT NULL,
	"source_game_id" text NOT NULL,
	"dedupe_key" text NOT NULL,
	CONSTRAINT "games_source_source_game_id_unique" UNIQUE("source","source_game_id"),
	CONSTRAINT "games_season_id_dedupe_key_unique" UNIQUE("season_id","dedupe_key"),
	CONSTRAINT "games_status_check" CHECK ("games"."status" in ('scheduled', 'in_progress', 'final', 'postponed', 'cancelled')),
	CONSTRAINT "games_source_check" CHECK ("games"."source" in ('espn', 'ncaa'))
);
--> statement-breakpoint
CREATE TABLE "rating_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"pool_id" text,
	"kind" text NOT NULL,
	"trigger" text NOT NULL,
	"status" text NOT NULL,
	"request" jsonb,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text,
	"run_id" text,
	"actor" text,
	"started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "rating_jobs_kind_check" CHECK ("rating_jobs"."kind" in ('sync', 'compute', 'publish', 'pipeline')),
	CONSTRAINT "rating_jobs_status_check" CHECK ("rating_jobs"."status" in ('running', 'succeeded', 'skipped', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "rating_pool_members" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"pool_id" text NOT NULL,
	"season_id" text NOT NULL,
	"school_id" text NOT NULL,
	"conference_id" text,
	"conference_name" text,
	CONSTRAINT "rating_pool_members_pool_season_school_unique" UNIQUE("pool_id","season_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "rating_pools" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"division_sport_id" text NOT NULL,
	"sport_id" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"membership" jsonb NOT NULL,
	"source" jsonb NOT NULL,
	"schedule" jsonb NOT NULL,
	"config" jsonb NOT NULL,
	"method_version" integer NOT NULL,
	CONSTRAINT "rating_pools_sport_id_slug_unique" UNIQUE("sport_id","slug")
);
--> statement-breakpoint
CREATE TABLE "rating_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"pool_id" text NOT NULL,
	"season_id" text NOT NULL,
	"week_id" text NOT NULL,
	"through_at" timestamp with time zone,
	"method_version" integer NOT NULL,
	"params" jsonb NOT NULL,
	"diagnostics" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"game_count" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"trigger" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"published_at" timestamp with time zone,
	"published_by" text,
	CONSTRAINT "rating_runs_status_check" CHECK ("rating_runs"."status" in ('draft', 'published', 'superseded')),
	CONSTRAINT "rating_runs_trigger_check" CHECK ("rating_runs"."trigger" in ('cron', 'admin', 'cli'))
);
--> statement-breakpoint
CREATE TABLE "rating_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"run_id" text NOT NULL,
	"school_id" text NOT NULL,
	"conference_id" text,
	"conference_name" text,
	"power" double precision NOT NULL,
	"power_low" double precision NOT NULL,
	"power_high" double precision NOT NULL,
	"power_rank" integer NOT NULL,
	"power_rank_low" integer NOT NULL,
	"power_rank_high" integer NOT NULL,
	"strength" double precision NOT NULL,
	"sor" double precision,
	"sor_rank" integer,
	"sor_rank_low" integer,
	"sor_rank_high" integer,
	"sos" double precision,
	"sos_rank" integer,
	"sos_rank_low" integer,
	"sos_rank_high" integer,
	"sov" double precision,
	"sov_rank" integer,
	"sol" double precision,
	"record_sos" double precision,
	"record_sos_rank" integer,
	"owp" double precision,
	"oowp" double precision,
	"average_opponent_strength" double precision,
	"remaining_sos" double precision,
	"full_season_sos" double precision,
	"pool_wins" integer NOT NULL,
	"pool_losses" integer NOT NULL,
	"pool_ties" integer NOT NULL,
	"overall_wins" integer NOT NULL,
	"overall_losses" integer NOT NULL,
	"overall_ties" integer NOT NULL,
	"pool_games" integer NOT NULL,
	"tier_records" jsonb NOT NULL,
	"is_provisional" boolean NOT NULL,
	"explanation" jsonb NOT NULL,
	CONSTRAINT "rating_snapshots_run_id_school_id_unique" UNIQUE("run_id","school_id")
);
--> statement-breakpoint
CREATE TABLE "school_external_ids" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"school_id" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	CONSTRAINT "school_external_ids_provider_external_id_unique" UNIQUE("provider","external_id"),
	CONSTRAINT "school_external_ids_school_id_provider_unique" UNIQUE("school_id","provider"),
	CONSTRAINT "school_external_ids_provider_check" CHECK ("school_external_ids"."provider" in ('espn', 'ncaa'))
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_school_id_schools_id_fk" FOREIGN KEY ("home_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_school_id_schools_id_fk" FOREIGN KEY ("away_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_jobs" ADD CONSTRAINT "rating_jobs_pool_id_rating_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."rating_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_jobs" ADD CONSTRAINT "rating_jobs_run_id_rating_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."rating_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_pool_members" ADD CONSTRAINT "rating_pool_members_pool_id_rating_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."rating_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_pool_members" ADD CONSTRAINT "rating_pool_members_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_pool_members" ADD CONSTRAINT "rating_pool_members_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_pool_members" ADD CONSTRAINT "rating_pool_members_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_pools" ADD CONSTRAINT "rating_pools_division_sport_id_division_sports_id_fk" FOREIGN KEY ("division_sport_id") REFERENCES "public"."division_sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_pools" ADD CONSTRAINT "rating_pools_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_runs" ADD CONSTRAINT "rating_runs_pool_id_rating_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."rating_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_runs" ADD CONSTRAINT "rating_runs_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_runs" ADD CONSTRAINT "rating_runs_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_snapshots" ADD CONSTRAINT "rating_snapshots_run_id_rating_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."rating_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_snapshots" ADD CONSTRAINT "rating_snapshots_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_snapshots" ADD CONSTRAINT "rating_snapshots_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_external_ids" ADD CONSTRAINT "school_external_ids_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "games_week_id_index" ON "games" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "games_home_school_id_index" ON "games" USING btree ("home_school_id");--> statement-breakpoint
CREATE INDEX "games_away_school_id_index" ON "games" USING btree ("away_school_id");--> statement-breakpoint
CREATE INDEX "rating_jobs_pool_started_index" ON "rating_jobs" USING btree ("pool_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rating_jobs_one_running_per_pool" ON "rating_jobs" USING btree ("pool_id") WHERE "rating_jobs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "rating_jobs_run_id_index" ON "rating_jobs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "rating_pool_members_season_id_index" ON "rating_pool_members" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "rating_pool_members_school_id_index" ON "rating_pool_members" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "rating_pools_division_sport_id_index" ON "rating_pools" USING btree ("division_sport_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rating_runs_one_published_per_week" ON "rating_runs" USING btree ("pool_id","week_id") WHERE "rating_runs"."status" = 'published';--> statement-breakpoint
CREATE INDEX "rating_runs_pool_week_index" ON "rating_runs" USING btree ("pool_id","week_id");--> statement-breakpoint
CREATE INDEX "rating_runs_season_id_index" ON "rating_runs" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "rating_runs_week_id_index" ON "rating_runs" USING btree ("week_id");--> statement-breakpoint
CREATE INDEX "rating_snapshots_school_id_index" ON "rating_snapshots" USING btree ("school_id");--> statement-breakpoint
-- FCS football is the first pool. It starts inactive and private: backfill the
-- seasons first, then turn on the cron (is_active) and the pages (is_public) in
-- admin under Ratings. Config = the calibrated values in
-- apps/web/content/ratings-validation/football-fcs.json (pnpm ratings:calibrate).
INSERT INTO "rating_pools" ("id", "division_sport_id", "sport_id", "slug", "name", "is_active", "is_public", "membership", "source", "schedule", "config", "method_version")
SELECT
  gen_random_uuid()::text,
  "division_sports"."id",
  "sports"."id",
  'fcs',
  'FCS',
  false,
  false,
  '{"type":"espn_group","groupId":"81"}'::jsonb,
  '{"espnLeague":"football/college-football","scoreboardGroups":"81","regulationPeriods":4,"ncaaPath":"football/fcs","levelGroups":{"FBS":"80","FCS":"81","DII":"57","DIII":"58"}}'::jsonb,
  '{"cadence":"weekly","windows":[{"day":6,"startHour":16,"endHour":36}]}'::jsonb,
  '{"marginTransform":{"type":"cap","cap":35},"overtimeMargin":3,"priorGames":2,"priorCarryover":0.85,"newcomerPrior":-6,"homeFieldPrior":0,"homeFieldPriorGames":20,"powerHalfLifeWeeks":12,"sigma":14.72,"benchmark":8.98,"minRankedGames":3,"provisionalMinAverageGames":4,"tierFloors":[0.5,0.25,0.1],"posteriorSamples":1000,"seed":1}'::jsonb,
  1
FROM "division_sports"
JOIN "sports" ON "sports"."id" = "division_sports"."sport_id"
JOIN "divisions" ON "divisions"."id" = "division_sports"."division_id"
WHERE "sports"."slug" = 'football'
AND "divisions"."slug" = 'fcs'
AND NOT EXISTS (
  SELECT 1 FROM "rating_pools" "existing"
  WHERE "existing"."sport_id" = "sports"."id" AND "existing"."slug" = 'fcs'
);
--> statement-breakpoint
ALTER TABLE "school_external_ids" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "games" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rating_pools" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rating_pool_members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rating_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rating_snapshots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rating_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- ESPN team ids for Redshirt schools, matched by name and checked one by one against
-- ESPN's team endpoint. ESPN uses one id per school across sports (McNeese is 2377 in
-- football and both basketballs). Keyed by Sanity id so it lands
-- the same in every environment. Admin adds the rest under Ratings > Team mapping.
INSERT INTO "school_external_ids" ("id", "school_id", "provider", "external_id")
SELECT gen_random_uuid()::text, "schools"."id", 'espn', "ids"."espn_id"
FROM (VALUES
  ('eff7d203-9b30-43e7-8e7b-523959e2b9ee', '2000'), -- Abilene Christian University
  ('8fef48b6-81c0-4f2a-8de3-cf3e423ab57a', '2010'), -- Alabama A&M University
  ('f8fd9d7f-2ae5-4a6b-b434-709e9382a183', '2011'), -- Alabama State University
  ('cf1d33d7-1028-433e-8aa8-0f50489cc9e6', '2016'), -- Alcorn State University
  ('b3bbb4f3-4ba9-4250-9e3d-02167a33d8df', '2046'), -- Austin Peay State University
  ('4d330f77-24ca-4776-82a8-1aa14ea9f03f', '2065'), -- Bethune-Cookman University
  ('f75e8590-28c5-432b-a15c-2852b7a77ee9', '225'), -- Brown University
  ('bc5c860c-4bd5-4d97-80d1-84c65f23a52f', '2803'), -- Bryant University
  ('191c5509-325b-4ac6-ac84-cf6d8b93873f', '2083'), -- Bucknell University
  ('b972811a-ff7f-411f-8568-6cfa228c09a4', '2086'), -- Butler University
  ('6743d647-00b3-452e-b0e0-15e35a2a26bc', '13'), -- California Polytechnic State University
  ('c0a82950-fa35-4ad0-8f77-143efa98e888', '16'), -- California State University, Sacramento
  ('baaaf353-2c03-498d-b661-f95e85126cdd', '2097'), -- Campbell University
  ('39c2fe44-a12f-41b4-9cbd-96bcb53fb791', '2115'), -- Central Connecticut State University
  ('f9d1ddf3-58b9-43ff-a3e2-f2eed245dd91', '2127'), -- Charleston Southern University
  ('39d04154-ef70-4c2d-b8eb-c374e91a53e4', '2130'), -- Chicago State University
  ('58157a9b-db90-4ff1-b0a5-40a617a8d065', '2142'), -- Colgate University
  ('010593e3-f21c-40d8-91f6-7102357d69a9', '107'), -- College of the Holy Cross
  ('ec8db5ef-7b3e-4b8e-a744-7f6568f54bd9', '171'), -- Columbia University
  ('7664e357-75ba-4012-ab46-ebcf78147163', '172'), -- Cornell University
  ('486df639-7987-4e0f-b6bb-c09cba3fb26e', '159'), -- Dartmouth College
  ('4e2e15b3-8bf7-4479-9c90-69a0462eb2e3', '2166'), -- Davidson College
  ('7d6c79a3-3ac1-4dc4-9d1e-9407446c651a', '2169'), -- Delaware State University
  ('28b00628-0a7e-40c7-bd2c-bbd86201e07d', '2181'), -- Drake University
  ('8fcac736-78da-4b46-9637-7c14b43f56be', '2184'), -- Duquesne University
  ('b7857f7f-1f47-403b-8ec2-440467fe9543', '2193'), -- East Tennessee State University
  ('1e032b0c-d2fd-4bb3-8282-ed58b2566734', '2837'), -- East Texas A&M University
  ('37409c66-3af0-452d-98e2-d67cade65074', '2197'), -- Eastern Illinois University
  ('c2a00e66-9376-45c4-bc62-37eb18f0d233', '2198'), -- Eastern Kentucky University
  ('a9640560-13bb-4337-a7f8-1d29ae6fcfe7', '331'), -- Eastern Washington University
  ('7dbef86f-bca9-4f04-a1fa-dd8284c69b02', '2210'), -- Elon University
  ('5c3f0003-f572-4c1e-b184-c8fdd83638ed', '50'), -- Florida A&M University
  ('6fc88c6d-3f79-4475-8749-dcedd97f1ad6', '2230'), -- Fordham University
  ('e435265a-2af4-4c6d-b8fc-e383169f5ba0', '231'), -- Furman University
  ('b693b255-0a27-4fc5-acb9-845cedd17f3a', '2241'), -- Gardner-Webb University
  ('4b488d60-3561-4c86-99fe-69fc045f3265', '46'), -- Georgetown University
  ('2642acef-d8ec-4023-98d9-6c918300b1f7', '2755'), -- Grambling State University
  ('4d0c3d65-d7d2-46b8-8edf-c53787914ac6', '2261'), -- Hampton University
  ('cd4c2634-ae7c-4699-a155-890d544d5738', '108'), -- Harvard University
  ('571016db-1589-457f-87de-956352593210', '2277'), -- Houston Christian University
  ('dbf599c7-e3cb-40ac-8c24-5dfac5e9e159', '47'), -- Howard University
  ('24bd7e72-ffcb-44d2-a376-28f11fefbdca', '304'), -- Idaho State University
  ('81b44086-0af5-46d0-b112-a95fa75bc358', '2287'), -- Illinois State University
  ('a00f5a70-8ad0-4646-8d5a-53264b1468ab', '282'), -- Indiana State University
  ('3f0db11a-1472-4eaa-8ea3-9e2465c5ea67', '2296'), -- Jackson State University
  ('59e2ec30-026b-4ee6-ac69-60c3aecf157b', '55'), -- Jacksonville State University
  ('f88838d0-18c6-41b1-b3f1-a2f1842aa755', '338'), -- Kennesaw State University
  ('bae37e5e-e124-47df-aab5-41c9b7d62cea', '322'), -- Lafayette College
  ('3138d442-5bf4-4ab5-9d09-e8deae0371c0', '2320'), -- Lamar University
  ('17ce10b8-6acf-4369-9d48-263b06fb0af3', '2329'), -- Lehigh University
  ('db5884fa-0a10-452c-b847-c99555869d0d', '2815'), -- Lindenwood University
  ('54a4bca4-1852-4d60-9c63-75757dcf07fc', '2341'), -- Long Island University
  ('3a7f57b6-67b8-4eb3-b943-e2a7d9f990f4', '2368'), -- Marist College
  ('da21a4ae-ffac-4b51-b021-c7530a026fcb', '2377'), -- McNeese State University
  ('e3e2c848-6016-4132-a654-b3fb966d339f', '2382'), -- Mercer University
  ('0c2ffae8-6374-4445-915b-ad5047cc9a1f', '2385'), -- Mercyhurst University
  ('5c9ef252-84a2-4c3d-9d1f-929490ab7a7d', '2771'), -- Merrimack College
  ('2b11fbf9-91f6-4fff-99f8-e5fdc55902c7', '2400'), -- Mississippi Valley State University
  ('91e4c1f3-9b0a-44e2-92ec-fba1cb6f74c3', '2623'), -- Missouri State University
  ('568f3771-f05f-4d8d-81c5-3cb74d332ec0', '2405'), -- Monmouth University
  ('ee055390-21d0-442c-aa29-80d0c60a00ff', '147'), -- Montana State University
  ('8285c70f-4365-45a3-b7e6-75a3fd1dc20f', '2413'), -- Morehead State University
  ('3cbce229-e407-45d6-b674-9aa0dec47156', '2415'), -- Morgan State University
  ('c0965285-f2c6-4ced-b8cf-f84d6ea47bdf', '93'), -- Murray State University
  ('b915b8ab-8c22-4332-a571-0a08e50dbbf7', '2447'), -- Nicholls State University
  ('91e30469-1797-43b5-a7bf-7d5115d0efd2', '2450'), -- Norfolk State University
  ('82075c7c-8edf-464b-a1f1-bc13877b6d5c', '2448'), -- North Carolina A&T State University
  ('26f218e7-01e9-4115-9960-b8ebef16e643', '2428'), -- North Carolina Central University
  ('ead2828b-f168-4649-b577-c94888859f3c', '2449'), -- North Dakota State University
  ('cc033a59-67ce-4bbd-8ddb-e69823bb34b6', '2464'), -- Northern Arizona University
  ('08287af4-b036-4327-a9cd-1792303d4523', '2466'), -- Northwestern State University
  ('b41b0a03-fc00-49e0-a1f0-984b16c838cc', '2502'), -- Portland State University
  ('c0eb210a-b778-497d-96d5-134b5d2ac8c6', '2504'), -- Prairie View A&M University
  ('275b3f34-70a8-4c4d-a72d-0554b757765c', '2506'), -- Presbyterian College
  ('faad5014-5d09-429a-bad6-9b8befd2de85', '163'), -- Princeton University
  ('47deeb42-bfd0-48a3-85ed-f9a747c0a119', '2523'), -- Robert Morris University
  ('50f59289-0f53-4563-8fd3-f8601169201f', '2529'), -- Sacred Heart University
  ('46ff2c07-6793-4501-8a17-40caccbe06d7', '2598'), -- Saint Francis University
  ('61eb86f5-6847-4e26-b467-82530ae91825', '2534'), -- Sam Houston State University
  ('610cb55c-7e56-409b-9a1a-9d1d4feeb5d2', '2535'), -- Samford University
  ('9cde7849-7ce2-44da-a7a8-02041abf7c60', '2569'), -- South Carolina State University
  ('37c41ab4-ba61-45f2-8884-66c011054801', '2571'), -- South Dakota State University
  ('bdc88f73-aa7a-497e-90bd-18fc7a210eb8', '2546'), -- Southeast Missouri State University
  ('7716cfb2-01c8-4ca7-b45d-585ed45eed47', '2545'), -- Southeastern Louisiana University
  ('07886146-52df-4835-afc0-aeebbab810b1', '79'), -- Southern Illinois University
  ('58f3e577-33e2-459e-a322-79fc70f31f93', '2582'), -- Southern University
  ('0b7f2303-5e57-48b0-8841-408cb51938bf', '253'), -- Southern Utah University
  ('a1ee372b-a407-4e8c-bca2-0c53b4ff88b8', '2617'), -- Stephen F. Austin State University
  ('2d1ce78c-2f4e-4e30-8b63-3377efc97edc', '56'), -- Stetson University
  ('52208cf7-aecd-4dc8-9896-8f04d8e3739c', '284'), -- Stonehill College
  ('63913f57-c154-4e74-b669-b32ea1e4e50f', '2619'), -- Stony Brook University
  ('0565e372-7a6d-41d2-8c9c-d5fd7f7eefa9', '2627'), -- Tarleton State University
  ('b21ca0c2-9811-477a-8b44-8bb3691ad8fe', '2634'), -- Tennessee State University
  ('aea85839-c60e-419e-8ea7-1a1f59053d07', '2635'), -- Tennessee Technological University
  ('dcea3ba0-51b5-44f5-8ca8-b602529c3ffd', '2640'), -- Texas Southern University
  ('8ff5ef75-1b9d-4ff7-a30a-8ab9e752bf6b', '2643'), -- The Citadel
  ('35kJ4ZsQdeTVCUezOx9HlY', '292'), -- The University of Texas Rio Grande Valley
  ('dbb9f98f-3ea2-4bab-8f6e-1d70c31e670c', '119'), -- Towson University
  ('fdd4fffd-bafe-4c64-8125-bb4f63181c94', '399'), -- University at Albany
  ('43726097-8bd5-442e-8f67-05d469906de7', '2029'), -- University of Arkansas-Pine Bluff
  ('90d2ab3b-3f55-4f3d-9e4e-2f507e63c982', '302'), -- University of California, Davis
  ('b8c6281d-f9b9-4a5a-8eda-705887585725', '2110'), -- University of Central Arkansas
  ('bf188002-4842-4bac-ba63-da0958df561f', '2168'), -- University of Dayton
  ('6a041d18-e5bf-4a74-8b94-b88cac7c5269', '48'), -- University of Delaware
  ('92abd20c-67fa-40ef-8cea-4056e998b2c8', '70'), -- University of Idaho
  ('12471747-4995-42c7-86d0-d4c13455a018', '311'), -- University of Maine
  ('cb255787-dd81-4b99-aed3-207a245a9293', '149'), -- University of Montana
  ('65b42453-590b-4c9c-8be2-a91e3224f47f', '160'), -- University of New Hampshire
  ('3f55ebfc-a8cb-4e15-9dc9-199d7c744303', '2441'), -- University of New Haven
  ('8a26e5cd-baae-45a1-bf07-f1a757c1b820', '2453'), -- University of North Alabama
  ('27c17d71-1f10-44fe-8e8f-6c870b1cee9b', '155'), -- University of North Dakota
  ('b354bf78-e6ef-4504-8ca9-577f8625c1fb', '2458'), -- University of Northern Colorado
  ('ae948ac0-d8b7-42a0-b9f2-290264c2d6bb', '2460'), -- University of Northern Iowa
  ('9106ab0c-3cec-47b0-801d-cf2bde1c80ab', '219'), -- University of Pennsylvania
  ('cceb4c51-116b-4db5-a6ca-69d86d2b2347', '227'), -- University of Rhode Island
  ('bf8d5ace-ca5d-457f-b863-3636279338ff', '257'), -- University of Richmond
  ('50da244d-2237-4891-aece-b7d6384342f3', '301'), -- University of San Diego
  ('2615fe62-8d20-435f-8ca4-ffe2bf8d6fe3', '233'), -- University of South Dakota
  ('47b2d47a-f9a2-43aa-812c-ad1378d44728', '2900'), -- University of St. Thomas (Minn.)
  ('f7c77e71-1811-4166-9579-f62085d51362', '236'), -- University of Tennessee at Chattanooga
  ('50c1607b-c218-41a1-afad-01268fb36028', '2630'), -- University of Tennessee at Martin
  ('ff8cf273-b094-4c6b-8d18-246d403177e9', '2916'), -- University of the Incarnate Word
  ('ab8b86b3-9742-4300-ab3c-7084d7187f95', '110242'), -- University of West Florida
  ('eee7587a-c92b-4cd4-ab47-22f4a6760f92', '2698'), -- University of West Georgia
  ('e3b20185-19f3-4a7e-9fc1-57fc617fc3d8', '2751'), -- University of Wyoming
  ('ea5a3ca0-403e-4b40-96f3-52c65da0fa8d', '3101'), -- Utah Tech University
  ('d8b0ec9a-cf1e-4c6f-866f-62672b7ec2b0', '2674'), -- Valparaiso University
  ('64e29c59-54d3-41b4-a130-d5bb7c33d20e', '222'), -- Villanova University
  ('49205451-d185-49ec-8abf-1a4acfd67454', '2678'), -- Virginia Military Institute
  ('114d5d5f-e063-481a-9acb-a175e8e0cf5e', '2681'), -- Wagner College
  ('c917c8ba-ff8a-49b2-9e6b-a3ab78e5e5fb', '2692'), -- Weber State University
  ('63a3dda8-c6fa-4a7d-9303-634e7d690a24', '2717'), -- Western Carolina University
  ('10b5d206-6e32-47a1-a24d-8d33ba0d1a43', '2710'), -- Western Illinois University
  ('a2f61f5a-6724-4688-861c-89c099b779a9', '2729'), -- William & Mary
  ('160e2342-66b6-4d8d-8edd-42ec3955a9a4', '2747'), -- Wofford College
  ('f188c989-125c-4cdf-a46b-43a485a9bc95', '43'), -- Yale University
  ('6cb91e65-3ab8-40b9-89aa-764b4a301dcc', '2754') -- Youngstown State University
) AS "ids" ("sanity_id", "espn_id")
JOIN "schools" ON "schools"."sanity_id" = "ids"."sanity_id"
ON CONFLICT DO NOTHING;
