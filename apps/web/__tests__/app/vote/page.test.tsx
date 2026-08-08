import type { ReactNode } from "react";

const {
  mockAuthProtect,
  mockGetSportIdBySlug,
  mockUserCanVoteOnPoll,
  mockHasVoterVoted,
  mockGetVotingWeek,
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
  mockGetVotingWeek: vi.fn(),
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
    getVotingWeek: mockGetVotingWeek,
    getCurrentSeason: mockGetCurrentSeason,
  };
});

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: (
    params: Promise<{ sport: string; division: string }>,
    _fallback: unknown,
    render: (
      resolved: { sport: string; division: string },
      options: { perspective: string; stega: boolean },
    ) => Promise<unknown>,
  ) =>
    params.then((resolved) =>
      render(resolved, { perspective: "published", stega: false }),
    ),
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

import VotePage, {
  VotePageAuth,
} from "@/app/(auth)/(vote)/vote/college/[sport]/[division]/page";

const divisionHeaders = [
  ["fcs", /Football Championship Subdivision/i],
  ["d2", /Division II/i],
  ["d3", /Division III/i],
  ["power-conferences", /Power Conferences/i],
  ["mid-major", /Mid-Major/i],
] as const;

const publishedOptions = { perspective: "published" as const, stega: false };

describe("VotePageAuth", () => {
  beforeEach(() => {
    mockAuthProtect.mockReset().mockResolvedValue({ userId: "user-1" });
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockUserCanVoteOnPoll.mockReset().mockResolvedValue(true);
    mockHasVoterVoted.mockReset().mockResolvedValue(false);
    mockGetVotingWeek.mockReset().mockResolvedValue(1);
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

  it("calls notFound when schools data is missing", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });
    await expect(
      VotePageAuth({
        sport: "football",
        division: "fbs",
        options: publishedOptions,
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders vote form without header for unknown division", async () => {
    const ui = await VotePageAuth({
      sport: "football",
      division: "unknown-division",
      options: publishedOptions,
    });
    render(ui as ReactNode);
    expect(screen.getByTestId("vote-form-wrapper")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("calls notFound for invalid route params via VotePage", async () => {
    await expect(
      VotePage({
        params: Promise.resolve({ sport: "invalid-sport", division: "fbs" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders vote page via default export with valid params", async () => {
    const ui = await VotePage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
    });
    expect(ui).toBeTruthy();
  });

  it.each(divisionHeaders)(
    "renders division header for %s",
    async (division, headingPattern) => {
      const ui = await VotePageAuth({
        sport: "football",
        division,
        options: publishedOptions,
      });
      render(ui as ReactNode);
      expect(
        screen.getByRole("heading", { name: headingPattern }),
      ).toBeInTheDocument();
    },
  );

  it("maps previous ballot schools with and without Sanity matches", async () => {
    mockGetLatestVoterBallot.mockResolvedValue([
      {
        id: "1",
        userId: "user-1",
        division: "fbs",
        week: 1,
        year: 2025,
        createdAt: new Date(),
        teamId: "school-1",
        rank: 1,
        points: 25,
      },
      {
        id: "2",
        userId: "user-1",
        division: "fbs",
        week: 1,
        year: 2025,
        createdAt: new Date(),
        teamId: "school-missing",
        rank: 2,
        points: 24,
      },
    ]);
    mockClientFetch.mockResolvedValue([
      {
        _id: "school-1",
        name: "Alabama",
        shortName: "Alabama",
        abbreviation: "ALA",
        nickname: "Crimson Tide",
        image: "https://example.com/alabama.png",
      },
    ]);

    const ui = await VotePageAuth({
      sport: "football",
      division: "fbs",
      options: publishedOptions,
    });
    render(ui as ReactNode);
    expect(screen.getByTestId("vote-form-wrapper")).toBeInTheDocument();
    expect(mockClientFetch).toHaveBeenCalled();
  });
});
