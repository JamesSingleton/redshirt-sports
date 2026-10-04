import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  DivisionTop25Card,
  DivisionTop25CardSkeleton,
  isPollDivision,
  Top25Card,
  Top25CardSkeleton,
} from "@/components/rankings/top25-card";
import type { LatestPoll } from "@/lib/rankings-data";

const { mockGetCachedLatestPoll } = vi.hoisted(() => ({
  mockGetCachedLatestPoll: vi.fn(),
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedLatestPoll: mockGetCachedLatestPoll,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="team-logo" />,
}));

type Team = LatestPoll["rankings"][number];

function team(overrides: Partial<Team>): Team {
  return {
    _id: "team",
    name: "Team",
    shortName: "Team",
    slug: "team",
    rank: 1,
    _points: 100,
    firstPlaceVotes: 0,
    image: null,
    ...overrides,
  } as Team;
}

function poll(rankings: Team[], overrides: Partial<LatestPoll> = {}) {
  return {
    rankings,
    year: 2026,
    week: 5,
    throughDate: null,
    sport: "football",
    ...overrides,
  } as LatestPoll;
}

const fcsPoll = poll([
  team({
    _id: "montana",
    name: "University of Montana",
    shortName: "Montana",
    slug: "montana",
    rank: 1,
    _points: 500,
    firstPlaceVotes: 12,
    image: { asset: { _ref: "image-1" } } as never,
  }),
  team({
    _id: "",
    name: "No Slug College",
    shortName: "",
    slug: null,
    rank: 2,
    _points: 400,
  }),
  team({ _id: "orv", name: "ORV", rank: null, _points: 3 }),
  team({ _id: "deep", name: "Deep", rank: 26, _points: 2 }),
]);

const fbsPoll = poll(
  [
    team({
      _id: "bama",
      name: "Alabama",
      shortName: "Alabama",
      slug: "alabama",
    }),
  ],
  { throughDate: "2026-09-26", year: 2026, week: 4 },
);

function mockPolls(polls: Partial<Record<string, LatestPoll | null>>) {
  mockGetCachedLatestPoll.mockImplementation(
    async ({ division }: { division: string }) => polls[division] ?? null,
  );
}

async function renderAsync(element: Promise<ReactNode>) {
  return render(await element);
}

describe("Top25Card", () => {
  beforeEach(() => {
    mockGetCachedLatestPoll.mockReset();
  });

  it("renders nothing when no division has a poll", async () => {
    mockPolls({});
    const { container } = await renderAsync(Top25Card());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single poll without tabs", async () => {
    mockPolls({ fcs: fcsPoll });
    await renderAsync(Top25Card());

    expect(
      screen.getByRole("region", { name: "Top 25 polls" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All polls" })).toHaveAttribute(
      "href",
      "/college/football/rankings",
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByRole("link")).toHaveAttribute(
      "href",
      "/college/teams/montana",
    );
    expect(rows[0]).toHaveTextContent("1Montana(12)500");
    expect(within(rows[0]!).getByTestId("team-logo")).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent("2No Slug College400");
    expect(within(rows[1]!).queryByRole("link")).not.toBeInTheDocument();
    expect(within(rows[1]!).queryByTestId("team-logo")).not.toBeInTheDocument();

    expect(screen.getByText("2026 Week 5")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Full FCS rankings" }),
    ).toHaveAttribute("href", "/college/football/rankings/fcs/2026/5");
  });

  it("renders a tab per division and switches panels", async () => {
    mockPolls({ fcs: fcsPoll, fbs: fbsPoll });
    await renderAsync(Top25Card());

    expect(screen.getByRole("tab", { name: "FCS" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "FBS" }));

    expect(
      await screen.findByRole("link", { name: "Full FBS rankings" }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs/2026/4");
    expect(screen.getByText("Through Games SEP. 26, 2026")).toBeInTheDocument();
  });
});

describe("DivisionTop25Card", () => {
  beforeEach(() => {
    mockGetCachedLatestPoll.mockReset();
  });

  it("renders nothing when the division has no poll", async () => {
    mockPolls({});
    const { container } = await renderAsync(
      DivisionTop25Card({ division: "d2" }),
    );
    expect(container).toBeEmptyDOMElement();
    expect(mockGetCachedLatestPoll).toHaveBeenCalledTimes(1);
    expect(mockGetCachedLatestPoll).toHaveBeenCalledWith({
      sport: "football",
      division: "d2",
    });
  });

  it("renders the division's poll", async () => {
    mockPolls({ fbs: fbsPoll });
    await renderAsync(DivisionTop25Card({ division: "fbs" }));

    expect(
      screen.getByRole("region", { name: "FBS Top 25" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alabama/ })).toHaveAttribute(
      "href",
      "/college/teams/alabama",
    );
  });
});

describe("isPollDivision", () => {
  it("accepts football poll divisions only", () => {
    expect(isPollDivision("fcs")).toBe(true);
    expect(isPollDivision("d3")).toBe(true);
    expect(isPollDivision("naia")).toBe(false);
  });
});

describe("Top25 skeletons", () => {
  it("renders the tabbed card skeleton", () => {
    const { container } = render(<Top25CardSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the division card skeleton", () => {
    const { container } = render(<DivisionTop25CardSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
