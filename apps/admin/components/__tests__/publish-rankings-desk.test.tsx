import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublishRankingsDesk } from "@/components/publish-rankings-desk";

const PREVIEW = {
  ballotCount: 3,
  assignedCount: 5,
  missingCount: 2,
  alreadyPublished: false,
  existingRankingRows: 0,
  panel: [
    {
      userId: "user_submitted",
      firstName: "Marcus",
      lastName: "Thompson",
      organization: "ESPN",
      submitted: true,
      submittedAt: "2025-09-01T12:00:00.000Z",
      ballotEntries: [
        {
          rank: 1,
          points: 25,
          schoolId: "school-a",
          name: "Alabama",
          shortName: "Alabama",
          abbreviation: "ALA",
        },
        {
          rank: 2,
          points: 24,
          schoolId: "school-b",
          name: "Georgia",
          shortName: "Georgia",
          abbreviation: "UGA",
        },
      ],
    },
    {
      userId: "user_missing",
      firstName: "Taylor",
      lastName: "Reed",
      organization: "The Athletic",
      submitted: false,
      submittedAt: null,
      ballotEntries: [],
    },
  ],
  rankings: [
    {
      rank: 1,
      isTie: false,
      points: 25,
      schoolId: "school-a",
      name: "Alabama",
      shortName: "Alabama",
      abbreviation: "ALA",
      firstPlaceVotes: 1,
    },
  ],
};

const polls = [
  {
    id: "poll-1",
    name: "FCS",
    slug: "fcs",
    sportId: "sport-fb",
    sportSlug: "football",
    sportName: "Football",
  },
];

const mocks = vi.hoisted(() => ({
  years: vi.fn(),
  weeks: vi.fn(),
  preview: vi.fn(),
  publish: vi.fn(),
  mailto: vi.fn(),
}));

vi.mock("@/actions/publish-rankings", () => ({
  getYearsForPollSport: mocks.years,
  getWeeksForPollSportYear: mocks.weeks,
  previewRankingsPublish: mocks.preview,
  publishRankings: mocks.publish,
  getVoterNudgeMailto: mocks.mailto,
  reassignVoterBallotWeek: vi.fn(async () => undefined),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PublishRankingsDesk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.years.mockResolvedValue([2025]);
    mocks.weeks.mockResolvedValue([
      {
        weekKey: "2025-fb-3",
        legacyWeek: 3,
        label: "Week 3",
        seasonType: 1,
        weekNumber: 3,
      },
    ]);
    mocks.preview.mockResolvedValue(PREVIEW);
    mocks.publish.mockResolvedValue({ teams: 1, ballots: 3 });
    mocks.mailto.mockResolvedValue({ mailto: "mailto:test" });
  });

  async function renderWithLoadedWeek() {
    const user = userEvent.setup();
    render(<PublishRankingsDesk polls={polls} />);

    const loadButton = await screen.findByRole("button", { name: /load week/i });
    await user.click(loadButton);
    await screen.findByRole("heading", { name: /ballot inbox/i });

    return user;
  }

  async function openSubmittedBallot() {
    const user = await renderWithLoadedWeek();
    await user.click(screen.getByText(/marcus thompson/i));
    await screen.findByRole("heading", { name: /marcus thompson/i });
    return user;
  }

  it("opens the ballot sheet when a submitted voter is clicked", async () => {
    await openSubmittedBallot();

    expect(
      screen.getByRole("heading", { name: /marcus thompson/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Alabama" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "25" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Georgia" })).toBeInTheDocument();
  });

  it("shows the submitted voter's ballot entries in the sheet", async () => {
    await openSubmittedBallot();

    const rows = screen
      .getAllByRole("row")
      .filter(
        (row) =>
          within(row).queryByText("1") &&
          within(row).queryByText("Alabama") &&
          within(row).queryByText("25"),
      );
    expect(rows).toHaveLength(1);
  });

  it("does not open a sheet for a missing voter", async () => {
    const user = await renderWithLoadedWeek();

    const missingVoterButton = screen.getByRole("button", {
      name: /taylor reed/i,
    });
    expect(missingVoterButton).toBeDisabled();
    await user.click(missingVoterButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /taylor reed/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("closes the sheet when the close button is clicked", async () => {
    const user = await openSubmittedBallot();

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /marcus thompson/i }),
      ).not.toBeInTheDocument();
    });
  });
});
