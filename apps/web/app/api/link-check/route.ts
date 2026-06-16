import { NextResponse } from "next/server";

const REQUEST_TIMEOUT_MS = 5000;

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

function resolveTargetUrl(rawUrl: string, requestUrl: URL): URL | null {
  try {
    const target = new URL(rawUrl, requestUrl.origin);
    if (!["http:", "https:"].includes(target.protocol)) {
      return null;
    }
    return target;
  } catch {
    return null;
  }
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
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "RedshirtSportsLinkChecker/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
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
  const rawUrl = requestUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json(
      { ok: false, message: "Missing url parameter" },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const target = resolveTargetUrl(rawUrl, requestUrl);

  if (!target) {
    return NextResponse.json(
      { ok: false, message: "Invalid URL" },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  try {
    let response = await fetchWithTimeout(target, "HEAD");

    if (response.status === 405 || response.status === 501) {
      response = await fetchWithTimeout(target, "GET");
    }

    const ok = response.status >= 200 && response.status < 400;

    return NextResponse.json(
      {
        ok,
        status: response.status,
        finalUrl: response.url,
        message: ok ? undefined : `HTTP ${response.status}`,
      },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
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
