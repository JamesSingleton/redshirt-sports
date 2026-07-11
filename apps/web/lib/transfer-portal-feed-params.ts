import type { PortalEntryStatus } from "@redshirt-sports/db/queries/transfer-portal";

export interface TransferPortalFeedSearchParams {
  status?: string;
  position?: string;
  q?: string;
  school?: string;
}

export function parsePortalStatus(
  status: string | undefined,
): PortalEntryStatus {
  if (
    status === "COMMITTED" ||
    status === "ENTERED" ||
    status === "SIGNED" ||
    status === "ENROLLED" ||
    status === "WITHDRAWN"
  ) {
    return status;
  }

  return "all";
}

export function buildFeedQueryString(
  filters: TransferPortalFeedSearchParams,
): string {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.position) {
    params.set("position", filters.position);
  }
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.school) {
    params.set("school", filters.school);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function feedPath(
  sport: string,
  year?: number,
  filters: TransferPortalFeedSearchParams = {},
) {
  const base = year
    ? `/college/${sport}/transfer-portal/feed/${year}`
    : `/college/${sport}/transfer-portal/feed`;

  return `${base}${buildFeedQueryString(filters)}`;
}
