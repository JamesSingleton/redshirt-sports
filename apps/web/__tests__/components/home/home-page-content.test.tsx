import { render, screen, within } from "@testing-library/react";

import { HomePageContent } from "@/components/home/home-page-content";

vi.mock("@/components/sanity-image", () => ({
  default: () => null,
  IMAGE_SIZES: { homeHero: "100vw" },
}));

vi.mock("@/components/rankings/rankings-widget", () => ({
  RankingsWidget: () => null,
}));

type Post = Parameters<typeof HomePageContent>[0]["posts"][number];

const post = (index: number): Post =>
  ({
    _id: `post-${index}`,
    title: `Story ${index}`,
    slug: `story-${index}`,
    publishedAt: "2026-11-01T18:00:00Z",
    authors: [],
  }) as unknown as Post;

describe("HomePageContent heading outline", () => {
  it("has one visible H1, section H2s, and story H3s", () => {
    render(
      <HomePageContent
        posts={Array.from({ length: 8 }, (_, index) => post(index))}
        rankingsPolls={[]}
        leaderboardAd={null}
        sidebarAd={null}
      />,
    );

    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(
      "College football and basketball news at every level",
    );
    expect(h1s[0]).not.toHaveClass("sr-only");

    // The lead story is the top H2; the rail beside it is its own section.
    expect(
      screen.getByRole("heading", { level: 2, name: "Story 0" }),
    ).toBeInTheDocument();
    const topStories = screen.getByRole("heading", {
      level: 2,
      name: "Top stories",
    });
    const rail = topStories.parentElement as HTMLElement;
    expect(
      within(rail)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Story 1", "Story 2", "Story 3", "Story 4", "Story 5"]);
    expect(within(rail).queryAllByRole("heading", { level: 2 })).toEqual([
      topStories,
    ]);
  });
});
