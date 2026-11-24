CREATE TABLE "player_duplicate_pairs" (
	"player_a_id" bigint NOT NULL,
	"player_b_id" bigint NOT NULL,
	"score" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_duplicate_pairs_player_a_id_player_b_id_pk" PRIMARY KEY("player_a_id","player_b_id"),
	CONSTRAINT "player_duplicate_pairs_order_check" CHECK ("player_duplicate_pairs"."player_a_id" < "player_duplicate_pairs"."player_b_id")
);
--> statement-breakpoint
ALTER TABLE "player_duplicate_pairs" ADD CONSTRAINT "player_duplicate_pairs_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_duplicate_pairs" ADD CONSTRAINT "player_duplicate_pairs_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_duplicate_pairs_player_b_id_index" ON "player_duplicate_pairs" USING btree ("player_b_id");--> statement-breakpoint
-- Internal, read only by the server; no public API access (see 0020).
ALTER TABLE "player_duplicate_pairs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Backfill: each player's closest names, as refreshDuplicatePairs stores them.
INSERT INTO "player_duplicate_pairs" ("player_a_id", "player_b_id", "score")
SELECT least(p.id, m.id), greatest(p.id, m.id), max(m.score)
FROM "players" p
CROSS JOIN LATERAL (
  SELECT o.id, extensions.similarity(o.name_search, p.name_search) AS score
  FROM "players" o
  WHERE o.name_search OPERATOR(extensions.%) p.name_search
    AND o.id <> p.id
    AND o.merged_into_id IS NULL
    AND extensions.similarity(o.name_search, p.name_search) >= 0.4
  ORDER BY score DESC, o.id
  LIMIT 10
) m
WHERE p.merged_into_id IS NULL
GROUP BY 1, 2
ON CONFLICT DO NOTHING;
