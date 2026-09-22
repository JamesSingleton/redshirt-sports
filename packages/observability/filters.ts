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

function getEventExceptionMessages(event: ErrorEvent): string[] {
  const messages: string[] = [];

  if (typeof event.message === "string" && event.message.length > 0) {
    messages.push(event.message);
  }

  for (const exception of event.exception?.values ?? []) {
    if (typeof exception.value === "string" && exception.value.length > 0) {
      messages.push(exception.value);
    }
    const type = exception.type ?? "";
    const value = exception.value ?? "";
    const combined = `${type} ${value}`.trim();
    if (combined.length > 0) {
      messages.push(combined);
    }
  }

  return messages;
}

function getEventStackFrameFunctions(event: ErrorEvent): string[] {
  const names: string[] = [];
  for (const exception of event.exception?.values ?? []) {
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (typeof frame.function === "string" && frame.function.length > 0) {
        names.push(frame.function);
      }
    }
  }
  return names;
}

/**
 * Twitter/X iOS in-app browser chrome (`updateFooterPositions` /
 * `updateGapFiller`) references a host-page `CONFIG` global that the app
 * never defines. WebKit reports it as an unhandled ReferenceError attributed
 * to the document URL (no Twitter bundle frames).
 *
 * Match is intentionally narrow: CONFIG ReferenceError wording AND a stack
 * frame named `updateFooterPositions` or `updateGapFiller`. Never
 * blanket-drop bare `CONFIG` ReferenceErrors from app code.
 */
const twitterInAppBrowserConfigMessage =
  /^(?:ReferenceError:\s*)?(?:Can'?t find variable: CONFIG|Cannot find variable: CONFIG|CONFIG is not defined)\.?$/i;

const twitterInAppBrowserChromeFunctions = new Set([
  "updateFooterPositions",
  "updateGapFiller",
]);

function isTwitterInAppBrowserConfigMessage(message: string): boolean {
  return twitterInAppBrowserConfigMessage.test(message.trim());
}

function isTwitterInAppBrowserConfigError(originalException: unknown): boolean {
  if (typeof originalException === "string") {
    return isTwitterInAppBrowserConfigMessage(originalException);
  }
  if (typeof originalException !== "object" || originalException === null) {
    return false;
  }
  if (
    !("message" in originalException) ||
    typeof originalException.message !== "string"
  ) {
    return false;
  }
  return isTwitterInAppBrowserConfigMessage(originalException.message);
}

function isTwitterInAppBrowserConfigSentryEvent(
  event: ErrorEvent,
  originalException?: unknown,
): boolean {
  const hasConfigMessage =
    isTwitterInAppBrowserConfigError(originalException) ||
    getEventExceptionMessages(event).some(isTwitterInAppBrowserConfigMessage);

  if (!hasConfigMessage) {
    return false;
  }

  return getEventStackFrameFunctions(event).some((name) =>
    twitterInAppBrowserChromeFunctions.has(name),
  );
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

/** Drop Twitter/X in-app browser chrome CONFIG ReferenceErrors. */
export function clientBeforeSend(
  event: ErrorEvent,
  hint?: EventHint,
): ErrorEvent | null {
  if (isTwitterInAppBrowserConfigSentryEvent(event, hint?.originalException)) {
    return null;
  }

  return event;
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
