import { upsertConferenceFromSanity } from "@redshirt-sports/db/queries";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { safeCompare } from "@/lib/safe-compare";

const ConferencePayloadSchema = z.object({
  conference: z.object({
    _id: z.string(),
    name: z.string().optional().nullable(),
    shortName: z.string().optional().nullable(),
    abbreviation: z.string().optional().nullable(),
    slug: z.string().optional().nullable(),
    divisionSanityId: z.string().optional().nullable(),
    // Absent: left as they are. Null: the conference has none in Sanity.
    sportIds: z.array(z.string()).optional().nullable(),
    subdivisions: z
      .array(
        z.object({
          sportId: z.string().optional().nullable(),
          subdivisionId: z.string().optional().nullable(),
        }),
      )
      .optional()
      .nullable(),
  }),
});

/**
 * Keeps a Postgres conference, its sports, and its per-sport subdivisions
 * (FBS, FCS, Mid-Major, Power Conferences) in sync with Sanity. Called by
 * the sync-conference Sanity Function on publish, authenticated with
 * CONFERENCE_SYNC_SECRET.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : null;
  if (!token || !safeCompare(token, env.CONFERENCE_SYNC_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ConferencePayloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const conference = parsed.data.conference;
  const result = await upsertConferenceFromSanity({
    sanityId: conference._id,
    name: conference.name,
    shortName: conference.shortName,
    abbreviation: conference.abbreviation,
    slug: conference.slug,
    divisionSanityId: conference.divisionSanityId,
    sportIds:
      conference.sportIds === undefined
        ? undefined
        : (conference.sportIds ?? []),
    subdivisions:
      conference.subdivisions === undefined
        ? undefined
        : (conference.subdivisions ?? []),
  });

  if (conference.divisionSanityId && !result.divisionFound) {
    console.warn(
      `Conference ${conference._id}: division ${conference.divisionSanityId} isn't in Postgres; run the admin division loader.`,
    );
  }
  if (result.subdivisions && result.subdivisions.skipped.length > 0) {
    console.warn(
      `Conference ${conference._id}: subdivisions Postgres doesn't have; run the admin subdivision loader.`,
      result.subdivisions.skipped,
    );
  }

  return NextResponse.json({
    ok: true,
    action: result.action,
    id: result.id,
    sports: result.sports,
    subdivisions: result.subdivisions?.replaced ?? null,
    skippedSubdivisions: result.subdivisions?.skipped.length ?? 0,
  });
}
