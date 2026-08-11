import type { ReactNode } from "react";

const {
  mockAuthProtect,
  mockGetSportIdBySlug,
  mockGetVoterBallotSchoolEntries,
  mockGetVotingSeasonInfoBySportIds,
  mockRedirect,
} = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockGetVoterBallotSchoolEntries: vi.fn(),
  mockGetVotingSeasonInfoBySportIds: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: { protect: mockAuthProtect },
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getVoterBallotSchoolEntries: mockGetVoterBallotSchoolEntries,
  getVotingSeasonInfoBySportIds: mockGetVotingSeasonInfoBySportIds,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

vi.mock("@/components/vote/ballot-share-actions", () => ({
  BallotShareActions: () => <div data-testid="ballot-share-actions" />,
}));

import { render, screen } from "@testing-library/react";

import VoteConfirmationPage, {
  VoteConfirmationContent,
} from "@/app/(auth)/(vote)/vote/college/[sport]/[division]/confirmation/page";

describe("VoteConfirmationContent", () => {
  beforeEach(() => {
    mockAuthProtect.mockReset().mockResolvedValue({ userId: "user-1" });
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockGetVotingSeasonInfoBySportIds.mockReset().mockResolvedValue(
      new Map([
        [
          "sport_football",
          {
            sportId: "sport_football",
            year: 2025,
            votingWeek: 1,
            weekId: "week-1",
            isPreseason: false,
            isRegularSeason: true,
            isPostseason: false,
          },
        ],
      ]),
    );
    mockGetVoterBallotSchoolEntries.mockReset();
    mockRedirect.mockClear();
  });

  it("redirects back to vote page when sport is missing", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);

    await expect(
      VoteConfirmationContent({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/vote/college/football/fbs");
  });

  it("redirects back to vote page when there is no ballot", async () => {
    mockGetVoterBallotSchoolEntries.mockResolvedValue([]);

    await expect(
      VoteConfirmationContent({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/vote/college/football/fbs");
  });

  it("renders submitted schools when a ballot exists", async () => {
    mockGetVoterBallotSchoolEntries.mockResolvedValue([
      {
        teamId: "school-1",
        schoolId: "db-1",
        rank: 1,
        shortName: "Alabama",
        abbreviation: "ALA",
        name: "Alabama",
        image: null,
      },
      {
        teamId: "school-2",
        schoolId: "db-2",
        rank: 2,
        shortName: "Georgia",
        abbreviation: "UGA",
        name: "Georgia",
        image: null,
      },
    ]);

    const ui = await VoteConfirmationContent({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
    });
    render(ui as ReactNode);

    expect(
      screen.getByText(/Your Football Bowl Subdivision/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. Alabama/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Georgia/)).toBeInTheDocument();
    expect(screen.getByTestId("ballot-share-actions")).toBeInTheDocument();
  });

  it("default export wraps confirmation content in Suspense", () => {
    const ui = VoteConfirmationPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
    });
    expect(ui).toBeTruthy();
  });

  it("falls back to school name and unknown sport or division labels", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport_custom");
    mockGetVotingSeasonInfoBySportIds.mockResolvedValue(
      new Map([
        [
          "sport_custom",
          {
            sportId: "sport_custom",
            year: 2025,
            votingWeek: 1,
            weekId: "week-1",
            isPreseason: false,
            isRegularSeason: true,
            isPostseason: false,
          },
        ],
      ]),
    );
    mockGetVoterBallotSchoolEntries.mockResolvedValue([
      {
        teamId: "school-1",
        schoolId: "db-1",
        rank: 1,
        shortName: null,
        abbreviation: null,
        name: "Custom School",
        image: null,
      },
    ]);

    const ui = await VoteConfirmationContent({
      params: Promise.resolve({
        sport: "custom-sport",
        division: "custom-division",
      }),
    });
    render(ui as ReactNode);

    expect(
      screen.getByText(/Your custom-division custom-sport Top 25 Vote is In!/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. Custom School/)).toBeInTheDocument();
  });

  it("uses abbreviation when shortName is missing", async () => {
    mockGetVoterBallotSchoolEntries.mockResolvedValue([
      {
        teamId: "school-1",
        schoolId: "db-1",
        rank: 1,
        shortName: null,
        abbreviation: "ALA",
        name: "Alabama",
        image: null,
      },
    ]);

    const ui = await VoteConfirmationContent({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
    });
    render(ui as ReactNode);
    expect(screen.getByText(/1\. ALA/)).toBeInTheDocument();
  });

  it("redirects when season info is missing", async () => {
    mockGetVotingSeasonInfoBySportIds.mockResolvedValue(new Map());

    await expect(
      VoteConfirmationContent({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/vote/college/football/fbs");
  });
});
