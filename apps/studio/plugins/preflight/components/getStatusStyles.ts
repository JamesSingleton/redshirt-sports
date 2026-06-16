import type { CardTone } from "@sanity/ui";

import type { CheckStatus } from "../types";

export function getCardTone(status: CheckStatus): CardTone | undefined {
  switch (status) {
    case "success":
      return "positive";
    case "warning":
      return "caution";
    case "error":
      return "critical";
    default:
      return "default";
  }
}

export function getStatusForegroundColor(
  status: CheckStatus,
): string | undefined {
  switch (status) {
    case "success":
      return "var(--card-badge-positive-fg-color)";
    case "warning":
      return "var(--card-badge-caution-fg-color)";
    case "error":
      return "var(--card-badge-critical-fg-color)";
    default:
      return undefined;
  }
}
