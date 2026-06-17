import { NextResponse } from "next/server";

import {
  assertPublicHttpUrl,
  resolveLinkCheckTarget,
} from "@/lib/link-check-url";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 5;

const STUDIO_ORIGINS = [
  "http://localhost:3333",
  "http://127.0.0.1:3333",
  process.env.SANITY_STUDIO_URL,
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
].filter(Boolean) as string[];

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !STUDIO_ORIGINS.includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
  };
}

function isStudioRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && STUDIO_ORIGINS.includes(origin));
}

async function fetchWithTimeout(
  target: URL,
  method: "HEAD" | "GET",
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(target.toString(), {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "RedshirtSportsLinkChecker/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPublicUrl(
  initialTarget: URL,
  method: "HEAD" | "GET",
): Promise<{ response: Response; finalUrl: string }> {
  let target = initialTarget;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicHttpUrl(target);

    const response = await fetchWithTimeout(target, method);

    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: target.toString() };
    }

    const location = response.headers.get("location");
    if (!location) {
      return { response, finalUrl: target.toString() };
    }

    target = new URL(location, target);
  }

  throw new Error("Too many redirects");
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);

  if (!isStudioRequest(request)) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403, headers: corsHeaders(origin) },
    );
  }

  const rawUrl = requestUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { ok: false, message: "Missing url parameter" },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const target = resolveLinkCheckTarget(rawUrl, requestUrl);

  if (!target) {
    return NextResponse.json(
      { ok: false, message: "Invalid URL" },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  try {
    let { response, finalUrl } = await fetchPublicUrl(target, "HEAD");

    if (response.status === 405 || response.status === 501) {
      ({ response, finalUrl } = await fetchPublicUrl(target, "GET"));
    }

    const ok = response.status >= 200 && response.status < 400;

    return NextResponse.json(
      {
        ok,
        status: response.status,
        finalUrl,
        message: ok ? undefined : `HTTP ${response.status}`,
      },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid URL") {
      return NextResponse.json(
        { ok: false, message: "Invalid URL" },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Request timed out"
        : error instanceof Error
          ? error.message
          : "Failed to fetch";

    return NextResponse.json(
      { ok: false, message },
      { status: 502, headers: corsHeaders(origin) },
    );
  }
}
