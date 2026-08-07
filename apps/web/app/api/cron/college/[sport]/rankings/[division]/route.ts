import { NextResponse } from "next/server";

/**
 * Rankings publish is manual via the admin publish desk.
 * This cron endpoint is retired and always returns 404.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Cron rankings publish is disabled.",
    },
    { status: 404 },
  );
}
