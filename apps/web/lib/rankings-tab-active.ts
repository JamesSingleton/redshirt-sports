import type { RankingsTabId } from "@/components/rankings/rankings-tabs";

export function rankingsTabActiveFromPath(pathname: string): RankingsTabId {
  if (pathname.includes("/methodology")) {
    return "methodology";
  }
  if (pathname.includes("/history")) {
    return "history";
  }
  if (pathname.endsWith("/voters") || pathname.includes("/voters/")) {
    return "voters";
  }
  if (pathname.includes("/ballots")) {
    return "ballots";
  }
  return "poll";
}
