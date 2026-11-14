CREATE TABLE "conference_sport_subdivisions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"conference_id" text NOT NULL,
	"sport_id" text NOT NULL,
	"subdivision_id" text NOT NULL,
	CONSTRAINT "conference_sport_subdivisions_conference_id_sport_id_unique" UNIQUE("conference_id","sport_id")
);
--> statement-breakpoint
ALTER TABLE "recruitments" ADD COLUMN "origin_subdivision_id" text;--> statement-breakpoint
ALTER TABLE "recruitments" ADD COLUMN "destination_subdivision_id" text;--> statement-breakpoint
ALTER TABLE "school_conference_affiliations" ADD COLUMN "subdivision_override_id" text;--> statement-breakpoint
ALTER TABLE "conference_sport_subdivisions" ADD CONSTRAINT "conference_sport_subdivisions_conference_id_conferences_id_fk" FOREIGN KEY ("conference_id") REFERENCES "public"."conferences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_sport_subdivisions" ADD CONSTRAINT "conference_sport_subdivisions_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conference_sport_subdivisions" ADD CONSTRAINT "conference_sport_subdivisions_subdivision_id_divisions_id_fk" FOREIGN KEY ("subdivision_id") REFERENCES "public"."divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conference_sport_subdivisions_sport_id_index" ON "conference_sport_subdivisions" USING btree ("sport_id");--> statement-breakpoint
CREATE INDEX "conference_sport_subdivisions_subdivision_id_index" ON "conference_sport_subdivisions" USING btree ("subdivision_id");--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_origin_subdivision_id_divisions_id_fk" FOREIGN KEY ("origin_subdivision_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_destination_subdivision_id_divisions_id_fk" FOREIGN KEY ("destination_subdivision_id") REFERENCES "public"."divisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_conference_affiliations" ADD CONSTRAINT "school_conference_affiliations_subdivision_override_id_divisions_id_fk" FOREIGN KEY ("subdivision_override_id") REFERENCES "public"."divisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recruitments_origin_subdivision_id_index" ON "recruitments" USING btree ("origin_subdivision_id");--> statement-breakpoint
CREATE INDEX "recruitments_destination_subdivision_id_index" ON "recruitments" USING btree ("destination_subdivision_id");--> statement-breakpoint
-- Same as every table since 0020: deny-by-default for the Supabase data API.
ALTER TABLE "conference_sport_subdivisions" ENABLE ROW LEVEL SECURITY;
