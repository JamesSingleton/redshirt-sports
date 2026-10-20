import "server-only";

import { keys } from "@redshirt-sports/analytics/keys";

const { NEXT_PUBLIC_POSTHOG_HOST } = keys();

type HogqlResponse = {
  results?: Array<[string, number]>;
};

function posthogApiHost(): string | null {
  if (!NEXT_PUBLIC_POSTHOG_HOST) return null;
  return NEXT_PUBLIC_POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com");
}

/**
 * Top article pathnames from PostHog $pageview in the past 24 hours.
 * Requires POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID (server-only).
 */
export async function fetchMostReadPathnames(
  limit = 10,
): Promise<string[]> {
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiHost = posthogApiHost();

  if (!personalApiKey || !projectId || !apiHost) {
    return [];
  }

  const hogql = `
    SELECT
      properties.$pathname AS pathname,
      count() AS views
    FROM events
    WHERE
      event = '$pageview'
      AND timestamp > now() - INTERVAL 1 DAY
      AND properties.$pathname NOT LIKE '/api/%'
      AND properties.$pathname NOT LIKE '/college/%'
    GROUP BY pathname
    ORDER BY views DESC
    LIMIT ${limit}
  `;

  const response = await fetch(`${apiHost}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${personalApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query: hogql,
      },
    }),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as HogqlResponse;
  const rows = data.results ?? [];

  return rows
    .map(([pathname]) => pathname)
    .filter((pathname): pathname is string => typeof pathname === "string")
    .map((pathname) => pathname.replace(/\/$/, ""))
    .filter((pathname) => pathname.length > 1);
}

export function pathnameToArticleSlug(pathname: string): string | null {
  const normalized = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (!normalized || normalized.includes("/")) {
    return null;
  }
  return normalized;
}
