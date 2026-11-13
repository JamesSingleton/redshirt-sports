const USER_AGENT = "RedshirtSports/1.0 (+https://www.redshirtsports.com)";

export type FetchJsonOptions = {
  /** Per-attempt timeout. */
  timeoutMs?: number;
  /** Extra attempts after the first, for 429, 5xx, and network errors. */
  retries?: number;
  /** Tried once when the primary URL answers 401/403. */
  fallbackUrl?: string | null;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function location(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function retryable(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 429 || error.status >= 500;
  }
  // Timeouts and network failures.
  return true;
}

async function attempt(
  url: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new HttpError(
      `${response.status} ${response.statusText} (${location(url)})`,
      response.status,
    );
  }
  return (await response.json()) as unknown;
}

/** GET JSON with a timeout, jittered exponential backoff, and an optional auth fallback host. */
export async function fetchJson(
  url: string,
  options: FetchJsonOptions = {},
): Promise<unknown> {
  const {
    timeoutMs = 10_000,
    retries = 3,
    fallbackUrl = null,
    fetchImpl = fetch,
    sleep = wait,
  } = options;
  let lastError: unknown;
  for (let tryNumber = 0; tryNumber <= retries; tryNumber += 1) {
    try {
      return await attempt(url, timeoutMs, fetchImpl);
    } catch (error) {
      lastError = error;
      if (
        error instanceof HttpError &&
        (error.status === 401 || error.status === 403) &&
        fallbackUrl
      ) {
        return attempt(fallbackUrl, timeoutMs, fetchImpl);
      }
      if (!retryable(error) || tryNumber === retries) {
        break;
      }
      await sleep(500 * 2 ** tryNumber + Math.floor(Math.random() * 250));
    }
  }
  const reason =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Request failed for ${location(url)}: ${reason}`);
}
