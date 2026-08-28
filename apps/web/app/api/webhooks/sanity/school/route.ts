import { upsertSchoolFromSanity } from "@redshirt-sports/db/queries";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { safeCompare } from "@/lib/safe-compare";

const SchoolPayloadSchema = z.object({
  school: z.object({
    _id: z.string(),
    name: z.string().optional().nullable(),
    shortName: z.string().optional().nullable(),
    abbreviation: z.string().optional().nullable(),
    nickname: z.string().optional().nullable(),
    slug: z.string().optional().nullable(),
    image: z.unknown().optional().nullable(),
    top25Eligible: z.boolean().optional().nullable(),
  }),
});

export async function POST(request: Request) {
  const secret = env.SCHOOL_SYNC_SECRET;

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : null;

  if (!token || !safeCompare(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = SchoolPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const school = parsed.data.school;
  const result = await upsertSchoolFromSanity({
    sanityId: school._id,
    name: school.name,
    shortName: school.shortName,
    abbreviation: school.abbreviation,
    nickname: school.nickname,
    slug: school.slug,
    image: school.image,
    top25Eligible: school.top25Eligible,
  });

  return NextResponse.json({
    ok: true,
    action: result.action,
    id: result.id,
  });
}
