import { NextResponse } from "next/server";

/** Liveness — process is up. */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
