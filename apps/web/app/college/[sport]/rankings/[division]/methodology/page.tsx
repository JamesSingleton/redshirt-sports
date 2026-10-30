import { permanentRedirect } from "next/navigation";

import { rankingsMethodologyHref } from "@/lib/rankings-nav";

export default function LegacyDivisionMethodologyRedirect() {
  permanentRedirect(rankingsMethodologyHref());
}
