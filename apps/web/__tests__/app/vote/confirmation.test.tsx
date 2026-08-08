import type { ReactNode } from "react";

const {
  mockAuthProtect,
  mockGetSportIdBySlug,
  mockGetVoterBallots,
  mockGetVotingWeek,
  mockGetCurrentSeason,
  mockClientFetch,
  mockRedirect,
} = vi.hoisted(() => ({
  mockAuthProtect: vi.fn(),
  mockGetSportIdBySlug: vi.fn(),
  mockGetVoterBallots: vi.fn(),
  mockGetVotingWeek: vi.fn(),
  mockGetCurrentSeason: vi.fn(),
  mockClientFetch: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: { protect: mockAuthProtect },
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getVoterBallots: mockGetVoterBallots,
}));

vi.mock("@/utils/espn", () => ({
  getVotingWeek: mockGetVotingWeek,
  getCurrentSeason: mockGetCurrentSeason,
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { fetch: mockClientFetch },
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  schoolsByIdQuery: "schoolsByIdQuery",
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

import { render, screen } from "@testing-library/react";

import VoteConfirmationPage, {
  VoteConfirmationContent,
} from "@/app/(auth)/(vote)/vote/college/[sport]/[division]/confirmation/page";

describe("VoteConfirmationContent", () => {
  beforeEach(() => {
    mockAuthProtect.mockReset().mockResolvedValue({ userId: "user-1" });
    mockGetSportIdBySlug.mockReset().mockResolvedValue("sport_football");
    mockGetVotingWeek.mockReset().mockResolvedValue(1);
    mockGetCurrentSeason.mockReset().mockResolvedValue({ year: 2025 });
    mockGetVoterBallots.mockReset();
    mockClientFetch.mockReset();
    mockRedirect.mockClear();
  });

  it("redirects back to vote page when there is no ballot", async () => {
    mockGetVoterBallots.mockResolvedValue([]);

    await expect(
      VoteConfirmationContent({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/vote/college/football/fbs");
  });

  it("renders submitted schools when a ballot exists", async () => {
    mockGetVoterBallots.mockResolvedValue([
      {
        teamId: "school-1",
        rank: 1,
        points: 25,
        userId: "user-1",
        division: "fbs",
        week: 1,
        year: 2025,
        id: "1",
        createdAt: new Date(),
      },
      {
        teamId: "school-2",
        rank: 2,
        points: 24,
        userId: "user-1",
        division: "fbs",
        week: 1,
        year: 2025,
        id: "2",
        createdAt: new Date(),
      },
    ]);
    mockClientFetch.mockResolvedValue([
      {
        _id: "school-1",
        shortName: "Alabama",
        abbreviation: "ALA",
        name: "Alabama",
        image: null,
      },
      {
        _id: "school-2",
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
  });

  it("default export wraps confirmation content in Suspense", () => {
    const ui = VoteConfirmationPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
    });
    expect(ui).toBeTruthy();
  });

  it("falls back to school name and unknown sport or division labels", async () => {
    mockGetVoterBallots.mockResolvedValue([
      {
        teamId: "school-1",
        rank: 1,
        points: 25,
        userId: "user-1",
        division: "custom-division",
        week: 1,
        year: 2025,
        id: "1",
        createdAt: new Date(),
      },
    ]);
    mockClientFetch.mockResolvedValue([
      {
        _id: "school-1",
        shortName: null,
        abbreviation: null,
        name: "Custom School",
        image: null,
      },
    ]);
    mockGetSportIdBySlug.mockResolvedValue(null);

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
    mockGetVoterBallots.mockResolvedValue([
      {
        teamId: "school-1",
        rank: 1,
        points: 25,
        userId: "user-1",
        division: "fbs",
        week: 1,
        year: 2025,
        id: "1",
        createdAt: new Date(),
      },
    ]);
    mockClientFetch.mockResolvedValue([
      {
        _id: "school-1",
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
});
