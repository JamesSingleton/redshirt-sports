CREATE TABLE "player_external_ids" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "player_external_ids_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"player_id" bigint NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_external_ids_provider_external_id_unique" UNIQUE("provider","external_id"),
	CONSTRAINT "player_external_ids_player_id_provider_unique" UNIQUE("player_id","provider"),
	CONSTRAINT "player_external_ids_provider_check" CHECK ("player_external_ids"."provider" in ('espn', 'ncaa')),
	CONSTRAINT "player_external_ids_external_id_check" CHECK ("player_external_ids"."external_id" ~ '^[0-9]{1,12}$')
);
--> statement-breakpoint
ALTER TABLE "player_external_ids" ADD CONSTRAINT "player_external_ids_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_external_ids" ADD CONSTRAINT "player_external_ids_created_by_user_id_users_table_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_external_ids_created_by_user_id_index" ON "player_external_ids" USING btree ("created_by_user_id");
--> statement-breakpoint
-- Internal ids, read only by the server; no public API access (see 0020).
ALTER TABLE "player_external_ids" ENABLE ROW LEVEL SECURITY;
