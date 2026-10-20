// posthog-before-send.ts
import type { CaptureResult } from "posthog-js";

// NOTE: These patterns mirror the Sentry filters (clientIgnoreErrors,
// clientDenyUrls, Twitter in-app browser CONFIG check). Keep them in sync.

const clientIgnoreErrors: Array<string | RegExp> = [
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

const clientDenyUrls: Array<string | RegExp> = [
  /extensions\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /scripts\/inpage\.js/i,
];

const twitterInAppBrowserConfigMessage =
  /^(?:ReferenceError:\s*)?(?:Can'?t find variable: CONFIG|Cannot find variable: CONFIG|CONFIG is not defined)\.?$/i;

const twitterInAppBrowserChromeFunctions = new Set([
  "updateFooterPositions",
  "updateGapFiller",
]);

type PostHogException = {
  type?: string;
  value?: string;
  stacktrace?: {
    frames?: Array<{ function?: string; filename?: string }>;
  };
};

function matchesAny(patterns: Array<string | RegExp>, value: string): boolean {
  return patterns.some((p) =>
    typeof p === "string" ? value.includes(p) : p.test(value),
  );
}

function shouldDropException(event: CaptureResult): boolean {
  const list = (event.properties?.$exception_list ?? []) as PostHogException[];

  for (const ex of list) {
    const value = ex.value ?? "";
    const combined = `${ex.type ?? ""}: ${value}`.trim();
    const frames = ex.stacktrace?.frames ?? [];

    if (
      matchesAny(clientIgnoreErrors, value) ||
      matchesAny(clientIgnoreErrors, combined)
    ) {
      return true;
    }

    if (
      frames.some((f) => f.filename && matchesAny(clientDenyUrls, f.filename))
    ) {
      return true;
    }

    // Narrow match: CONFIG message AND a Twitter chrome function in the stack
    const hasConfigMessage =
      twitterInAppBrowserConfigMessage.test(value.trim()) ||
      twitterInAppBrowserConfigMessage.test(combined);
    const hasChromeFrame = frames.some(
      (f) => f.function && twitterInAppBrowserChromeFunctions.has(f.function),
    );
    if (hasConfigMessage && hasChromeFrame) {
      return true;
    }
  }

  return false;
}

export function posthogBeforeSend(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event) return null;

  if (event.event === "$exception" && shouldDropException(event)) {
    return null;
  }

  if (event.event === "$pageview") {
    const url = event.properties?.$current_url ?? window.location.href;
    if (url.includes("/vote")) return null;
  }

  return event;
}
