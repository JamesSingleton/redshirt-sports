import type { AdminDashboardSnapshot } from "@redshirt-sports/db/queries";
import { weekTitle } from "@redshirt-sports/db/utils/week-mapping";

function sportTitle(slug: string) {
  switch (slug) {
    case "football":
      return "Football";
    case "mens-basketball":
      return "Men's basketball";
    case "womens-basketball":
      return "Women's basketball";
    default:
      return slug;
  }
}

export type DashboardPanel = {
  id: string;
  name: string;
  slug: string;
  sportSlug: string;
  sportTitle: string;
  isActive: boolean;
  assignedCount: number;
  submittedCount: number | null;
  weekLabel: string | null;
  year: number | null;
};

export type DashboardData = {
  credentialedVoters: number;
  totalUsers: number;
  staleAssignments: number;
  activePanels: number;
  panels: DashboardPanel[];
  headline: {
    sportTitle: string;
    weekLabel: string;
    year: number;
    period: "preseason" | "regular" | "postseason" | "offseason";
  } | null;
};

/** Pure mapping from DB snapshot → page view model (testable without DB/auth). */
export function buildDashboardData(
  snapshot: AdminDashboardSnapshot,
): DashboardData {
  const panels: DashboardPanel[] = snapshot.panels.map((panel) => ({
    id: panel.id,
    name: panel.name,
    slug: panel.slug,
    sportSlug: panel.sportSlug,
    sportTitle: sportTitle(panel.sportSlug),
    isActive: panel.isActive,
    assignedCount: panel.assignedCount,
    submittedCount: panel.submittedCount,
    weekLabel: panel.votingWeek != null ? weekTitle(panel.votingWeek) : null,
    year: panel.year,
  }));

  const primaryPanel =
    snapshot.panels.find((panel) => panel.sportSlug === "football") ??
    snapshot.panels[0];

  let headline: DashboardData["headline"] = null;
  if (
    primaryPanel &&
    primaryPanel.votingWeek != null &&
    primaryPanel.year != null
  ) {
    headline = {
      sportTitle: sportTitle(primaryPanel.sportSlug || "football"),
      weekLabel: weekTitle(primaryPanel.votingWeek),
      year: primaryPanel.year,
      period: primaryPanel.isPreseason
        ? "preseason"
        : primaryPanel.isRegularSeason
          ? "regular"
          : primaryPanel.isPostseason
            ? "postseason"
            : "offseason",
    };
  }

  return {
    credentialedVoters: snapshot.credentialedVoters,
    totalUsers: snapshot.totalUsers,
    staleAssignments: snapshot.staleAssignments,
    activePanels: panels.filter((panel) => panel.isActive).length,
    panels,
    headline,
  };
}
