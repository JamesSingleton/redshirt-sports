import { render, screen } from "@testing-library/react";

const { mockFetchPage } = vi.hoisted(() => ({ mockFetchPage: vi.fn() }));

vi.mock("@/lib/sanity-fetch", () => ({ sanityFetchPage: mockFetchPage }));
vi.mock("@/lib/newsletter/topics", () => ({
  getCachedPollOptions: async () => [
    { id: "poll-fcs", label: "Football: FCS Top 25" },
  ],
}));
vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: (
    _fallback: unknown,
    render: (options: object) => Promise<unknown>,
  ) => render({ perspective: "published", stega: false }),
}));

import NewsletterPage from "@/app/newsletter/page";

const posts = [
  {
    _id: "p1",
    title: "Montana State wins the Brawl",
    slug: "montana-state-wins",
    publishedAt: "2026-11-21T20:00:00.000Z",
    sport: "Football",
  },
];

async function renderPage() {
  render(await NewsletterPage());
}

describe("/newsletter", () => {
  beforeEach(() => mockFetchPage.mockResolvedValue({ data: posts }));
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.clearAllMocks();
  });

  it("pairs the signup form with a sample issue of real headlines", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The Week in College Sports",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /The Week in College Sports/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Football: FCS Top 25 alerts/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("link", { name: "Montana State wins the Brawl" }),
    ).toHaveAttribute("href", "/montana-state-wins");
    expect(
      screen.getByRole("heading", { name: "What you get" }),
    ).toBeInTheDocument();
  });

  it("still renders when Sanity has nothing", async () => {
    mockFetchPage.mockResolvedValue({ data: null });
    await renderPage();
    expect(
      screen.getByRole("figure", { name: "Sample issue" }),
    ).toBeInTheDocument();
  });

  it("says how the confirm link went, then drops it from the URL", async () => {
    window.history.replaceState(null, "", "/newsletter?status=confirmed&ref=x");
    await renderPage();
    expect(
      await screen.findByText(
        "You're subscribed. Your first issue arrives Sunday morning.",
      ),
    ).toBeInTheDocument();
    expect(window.location.search).toBe("?ref=x");
  });
});
