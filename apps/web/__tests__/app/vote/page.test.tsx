import type { ReactNode } from "react";

const {
  mockAuthProtect,
  mockGetSportIdBySlug,
  mockUserCanVoteOnPoll,
  mockHasVoterVoted,
  mockGetCurrentWeek,
  mockGetCurrentSeason,
  mockSanityFetchPage,
  mockGetLatestVoterBallot,
  mockClientFetch,
  mockRedirect,
  mockNotFound,
} = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockUserCanVoteOnPoll: vi.fn(),
  mockHasVoterVoted: vi.fn(),
  mockGetCurrentWeek: vi.fn(),
  mockGetCurrentSeason: vi.fn(),
  mockSanityFetchPage: vi.fn(),
  mockGetLatestVoterBallot: vi.fn(),
  mockClientFetch: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: { protect: mockAuthProtect },
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  hasVoterVoted: mockHasVoterVoted,
  getLatestVoterBallot: mockGetLatestVoterBallot,
}));

vi.mock("@/lib/require-poll-voter", () => ({
  userCanVoteOnPoll: mockUserCanVoteOnPoll,
}));

vi.mock("@/utils/espn", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/espn")>();
  return {
    ...actual,
    getCurrentWeek: mockGetCurrentWeek,
    getCurrentSeason: mockGetCurrentSeason,
  };
});

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: vi.fn(),
  defineLive: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { fetch: mockClientFetch },
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  schoolsBySportAndSubgroupingStringQuery: "schoolsQuery",
  schoolsForVotesQuery: "schoolsForVotesQuery",
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

vi.mock("@/components/vote-form-wrapper", () => ({
  __esModule: true,
  default: () => <div data-testid="vote-form-wrapper" />,
}));

import { render, screen } from "@testing-library/react";

import { VotePageAuth } from "@/app/(auth)/(vote)/vote/college/[sport]/[division]/page";

const publishedOptions = { perspective: "published" as const, stega: false };

describe("VotePageAuth", () => {
  beforeEach(() => {
    mockAuthProtect.mockReset().mockResolvedValue({ userId: "user-1" });
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockUserCanVoteOnPoll.mockReset().mockResolvedValue(true);
    mockHasVoterVoted.mockReset().mockResolvedValue(false);
    mockGetCurrentWeek.mockReset().mockResolvedValue(1);
    mockGetCurrentSeason.mockReset().mockResolvedValue({ year: 2025 });
    mockSanityFetchPage.mockReset().mockResolvedValue({
      data: [{ _id: "school-1", shortName: "Alabama" }],
    });
    mockGetLatestVoterBallot.mockReset().mockResolvedValue([]);
    mockClientFetch.mockReset().mockResolvedValue([]);
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("calls notFound when sport id is missing", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    await expect(
      VotePageAuth({
        sport: "football",
        division: "fbs",
        options: publishedOptions,
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("redirects home when user cannot vote on the poll", async () => {
    mockUserCanVoteOnPoll.mockResolvedValue(false);
    await expect(
      VotePageAuth({
        sport: "football",
        division: "fbs",
        options: publishedOptions,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("redirects to confirmation when user already voted", async () => {
    mockHasVoterVoted.mockResolvedValue(true);
    await expect(
      VotePageAuth({
        sport: "football",
        division: "fbs",
        options: publishedOptions,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/vote/college/football/fbs/confirmation");
  });

  it("renders the vote form when assigned and not yet voted", async () => {
    const ui = await VotePageAuth({
      sport: "football",
      division: "fbs",
      options: publishedOptions,
    });
    render(ui as ReactNode);

    expect(screen.getByTestId("vote-form-wrapper")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Football Bowl Subdivision/i }),
    ).toBeInTheDocument();
  });
});
