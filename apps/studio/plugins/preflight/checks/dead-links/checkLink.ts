import { getPresentationUrl } from "@/utils/helper";
import { toAbsoluteLinkUrl } from "../../utils/linkUrl";

export type LinkCheckResult = {
  status: "success" | "error";
  message?: string;
};

function toAbsoluteUrl(url: string): string {
  return toAbsoluteLinkUrl(url);
}

/**
 * Check if a link is reachable via the web app proxy so we can read real HTTP status codes.
 */
export async function checkLink(url: string): Promise<LinkCheckResult> {
  const baseUrl = getPresentationUrl();
  const endpoint = new URL("/api/link-check", baseUrl);
  endpoint.searchParams.set("url", toAbsoluteUrl(url));

  try {
    const response = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      return {
        status: "error",
        message: payload?.message ?? `Request failed (${response.status})`,
      };
    }

    const payload = (await response.json()) as {
      ok: boolean;
      status?: number;
      message?: string;
    };

    if (payload.ok) {
      return { status: "success" };
    }

    return {
      status: "error",
      message: payload.message
        ? `${payload.message}${payload.status ? ` (${payload.status})` : ""}`
        : "Failed to fetch",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to fetch",
    };
  }
}

export async function runWithConcurrency<T>(
  items: readonly T[],
  worker: (item: T) => Promise<void>,
  concurrency = 5,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item !== undefined) {
          await worker(item);
        }
      }
    },
  );

  await Promise.all(workers);
}
