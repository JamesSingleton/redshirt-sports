import { permanentRedirect } from "next/navigation";

import { rankingsMethodologyHref } from "@/lib/rankings-nav";

export default function LegacyRankingsMethodologyRedirect() {
  permanentRedirect(rankingsMethodologyHref());
}
