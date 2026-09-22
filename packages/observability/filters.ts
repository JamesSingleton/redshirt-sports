import type { ErrorEvent, EventHint } from "@sentry/nextjs";

/** Browser extension / in-app browser noise that is not actionable app code. */
export const clientIgnoreErrors: Array<string | RegExp> = [
  /webkit\.messageHandlers/i,
  /Failed to connect to MetaMask/i,
  /MetaMask extension not found/i,
  /runtime\.sendMessage/i,
  /^TypeError: network error$/i,
  /^TypeError: Load failed$/i,
  /Unexpected token 'else'/i,
  /HierarchyRequestError/i,
  /insertBefore/i,
];

/** Drop events whose stack frames originate from extensions or injected wallets. */
export const clientDenyUrls: Array<string | RegExp> = [
  /extensions\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /scripts\/inpage\.js/i,
];

/**
 * Transient upstream / network failures from Sanity CDN and Node fetch.
 * Prefer beforeSend for Sanity so real query bugs still surface.
 */
export const serverIgnoreErrors: Array<string | RegExp> = [
  /Client network socket disconnected/i,
];

/** Health probes and CORS preflight — high volume, low signal. */
export const ignoredTransactionNames: Array<string | RegExp> = [
  /^GET \/api\/health$/,
  /^GET \/api\/health\/ready$/,
  /^OPTIONS /i,
];

function getEventMessage(event: ErrorEvent): string {
  if (typeof event.message === "string" && event.message.length > 0) {
    return event.message;
  }

  const exception = event.exception?.values?.[0];
  if (!exception) {
    return "";
  }

  const type = exception.type ?? "";
  const value = exception.value ?? "";
  return `${type} ${value}`.trim();
}

function isTransientSanityFailure(message: string): boolean {
  const hasSanityHost = /apicdn\.sanity\.io|api\.sanity\.io/i.test(message);
  const hasTransientStatus =
    /502 Bad Gateway|503 Service Unavailable|504 Gateway Timeout/i.test(
      message,
    );
  const hasFetchFailure = /fetch failed/i.test(message);

  if (hasSanityHost && (hasTransientStatus || hasFetchFailure)) {
    return true;
  }

  // Node undici "fetch failed" with TLS disconnect (often Sanity CDN blips)
  if (
    hasFetchFailure &&
    /network socket disconnected|ECONNRESET|ETIMEDOUT|ECONNREFUSED/i.test(
      message,
    )
  ) {
    return true;
  }

  return false;
}

/** Drop known 4xx client errors and transient Sanity / network failures. */
export function serverBeforeSend(
  event: ErrorEvent,
  _hint?: EventHint,
): ErrorEvent | null {
  const message = getEventMessage(event);
  const status = event.contexts?.response?.status_code;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return null;
  }

  if (isTransientSanityFailure(message)) {
    return null;
  }

  return event;
}

export function shouldIgnoreTransaction(name: string | undefined): boolean {
  if (!name) return false;
  return ignoredTransactionNames.some((pattern) =>
    typeof pattern === "string" ? pattern === name : pattern.test(name),
  );
}
