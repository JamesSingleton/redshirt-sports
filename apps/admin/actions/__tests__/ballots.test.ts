import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireArea, db } = vi.hoisted(() => ({
  mockRequireArea: vi.fn(),
  db: {
    getPollRankingPublishPreview: vi.fn(),
    listLegacyWeeksForSportYear: vi.fn(),
    listPolls: vi.fn(),
    listSeasonYearsForSport: vi.fn(),
  },
}));

vi.mock("@/lib/access", () => ({ requireArea: mockRequireArea }));
vi.mock("@redshirt-sports/db/queries", () => db);

import {
  getBallotPolls,
  getBallotWeek,
  getBallotWeeks,
  getBallotYears,
} from "@/actions/ballots";

const voter = (id: string, submitted: boolean, entries: unknown[] = []) => ({
  userId: id,
  firstName: "Voter",
  lastName: id,
  organization: id === "a" ? "SI" : null,
  submitted,
  submittedAt: submitted ? new Date("2026-11-10") : null,
  ballotEntries: entries,
});

describe("ballot actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireArea.mockResolvedValue({ userId: "user_viewer" });
  });

  it("lists active polls only", async () => {
    db.listPolls.mockResolvedValue([
      {
        id: "p1",
        name: "FCS Top 25",
        slug: "fcs",
        sportId: "fb",
        isActive: true,
        sport: { slug: "football" },
      },
      {
        id: "p2",
        name: "Old",
        slug: "old",
        sportId: "fb",
        isActive: false,
        sport: { slug: "football" },
      },
      {
        id: "p3",
        name: "No sport",
        slug: "x",
        sportId: "s",
        isActive: true,
        sport: null,
      },
    ]);
    expect(await getBallotPolls()).toEqual([
      {
        id: "p1",
        name: "FCS Top 25",
        slug: "fcs",
        sportId: "fb",
        sportSlug: "football",
      },
      { id: "p3", name: "No sport", slug: "x", sportId: "s", sportSlug: "" },
    ]);
    expect(mockRequireArea).toHaveBeenCalledWith("ballots");
  });

  it("lists years and weeks", async () => {
    db.listSeasonYearsForSport.mockResolvedValue([2026]);
    expect(await getBallotYears("fb")).toEqual([2026]);
    await expect(getBallotYears("")).rejects.toThrow("sportId is required");
    db.listLegacyWeeksForSportYear.mockResolvedValue([
      { weekKey: "2-10", label: "Week 10", legacyWeek: 10 },
    ]);
    expect(await getBallotWeeks({ sportId: "fb", year: 2026 })).toEqual([
      { weekKey: "2-10", label: "Week 10" },
    ]);
    await expect(getBallotWeeks({ sportId: "", year: 0 })).rejects.toThrow(
      "sportId and year are required",
    );
  });

  it("returns each ballot, who's out, and the consensus, nothing more", async () => {
    db.getPollRankingPublishPreview.mockResolvedValue({
      poll: { name: "FCS Top 25" },
      alreadyPublished: false,
      ballotCount: 1,
      assignedCount: 2,
      panel: [
        voter("a", true, [
          { rank: 1, schoolId: "mt", name: "Montana", shortName: null },
          {
            rank: 2,
            schoolId: "msu",
            name: "Montana State University",
            shortName: "Montana State",
          },
        ]),
        voter("b", false),
      ],
      missing: [voter("b", false)],
      rankings: Array.from({ length: 30 }, (_, i) => ({
        schoolId: `s${i}`,
        name: `School ${i}`,
        shortName: i === 0 ? "S0" : null,
      })),
    });
    const week = await getBallotWeek({
      sportSlug: "football",
      division: "fcs",
      year: 2026,
      weekKey: "2-10",
    });
    expect(db.getPollRankingPublishPreview).toHaveBeenCalledWith({
      sportSlug: "football",
      sport: "football",
      division: "fcs",
      year: 2026,
      weekKey: "2-10",
    });
    expect(week).toMatchObject({
      pollName: "FCS Top 25",
      published: false,
      ballotCount: 1,
      assignedCount: 2,
      ballots: [
        {
          userId: "a",
          name: "Voter a",
          organization: "SI",
          entries: [
            { rank: 1, schoolId: "mt", name: "Montana" },
            { rank: 2, schoolId: "msu", name: "Montana State" },
          ],
        },
      ],
      missing: [{ userId: "b", name: "Voter b", organization: null }],
    });
    expect(week.consensus).toHaveLength(25);
    expect(week.consensus[0]).toEqual({ schoolId: "s0", name: "S0" });
  });

  it("refuses an unknown sport or a missing week", async () => {
    const base = { division: "fcs", year: 2026, weekKey: "2-10" };
    await expect(
      getBallotWeek({ ...base, sportSlug: "lacrosse" }),
    ).rejects.toThrow("Unsupported sport: lacrosse");
    await expect(
      getBallotWeek({ ...base, sportSlug: "football", weekKey: "" }),
    ).rejects.toThrow("weekKey is required");
  });
});
