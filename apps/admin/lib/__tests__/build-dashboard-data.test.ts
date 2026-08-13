import { describe, expect, it } from "vitest";

import { buildDashboardData } from "@/lib/build-dashboard-data";

describe("buildDashboardData", () => {
  it("maps snapshot panels and prefers football for the headline", () => {
    const data = buildDashboardData({
      credentialedVoters: 43,
      totalUsers: 46,
      staleAssignments: 0,
      panels: [
        {
          id: "poll-fcs",
          name: "FCS",
          slug: "fcs",
          isActive: true,
          sportId: "sport-fb",
          sportSlug: "football",
          assignedCount: 20,
          submittedCount: 12,
          year: 2025,
          votingWeek: 3,
          weekId: "week-3",
          isPreseason: false,
          isRegularSeason: true,
          isPostseason: false,
        },
        {
          id: "poll-mbb",
          name: "D1",
          slug: "d1",
          isActive: true,
          sportId: "sport-mbb",
          sportSlug: "mens-basketball",
          assignedCount: 10,
          submittedCount: null,
          year: null,
          votingWeek: null,
          weekId: null,
          isPreseason: false,
          isRegularSeason: false,
          isPostseason: false,
        },
      ],
    });

    expect(data.credentialedVoters).toBe(43);
    expect(data.totalUsers).toBe(46);
    expect(data.staleAssignments).toBe(0);
    expect(data.activePanels).toBe(2);
    expect(data.panels[0]).toMatchObject({
      id: "poll-fcs",
      sportTitle: "Football",
      weekLabel: "Week 3",
      submittedCount: 12,
      assignedCount: 20,
    });
    expect(data.panels[1]).toMatchObject({
      sportTitle: "Men's basketball",
      weekLabel: null,
      submittedCount: null,
    });
    expect(data.headline).toEqual({
      sportTitle: "Football",
      weekLabel: "Week 3",
      year: 2025,
      period: "regular",
    });
  });

  it("returns a null headline when no panel has a voting week", () => {
    const data = buildDashboardData({
      credentialedVoters: 0,
      totalUsers: 0,
      staleAssignments: 1,
      panels: [],
    });

    expect(data.panels).toEqual([]);
    expect(data.activePanels).toBe(0);
    expect(data.headline).toBeNull();
    expect(data.staleAssignments).toBe(1);
  });
});
