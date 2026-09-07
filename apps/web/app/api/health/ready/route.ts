import { checkHealth } from "@redshirt-sports/db/utils/health";
import { NextResponse } from "next/server";

import redis from "@/utils/redis";

const READY_TIMEOUT_MS = 3_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Readiness — DB + Redis respond within a deadline. */
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    database: "error",
    redis: "error",
  };

  try {
    await withTimeout(checkHealth(), READY_TIMEOUT_MS);
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await withTimeout(redis.ping(), READY_TIMEOUT_MS);
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const ready = checks.database === "ok" && checks.redis === "ok";

  return NextResponse.json(
    { status: ready ? "ok" : "degraded", checks },
    { status: ready ? 200 : 503 },
  );
}
