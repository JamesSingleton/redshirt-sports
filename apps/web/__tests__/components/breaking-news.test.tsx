import { act, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

const { mockCachedSanity, mockResolve } = vi.hoisted(() => ({
  mockCachedSanity: vi.fn(),
  mockResolve: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  cachedSanity: mockCachedSanity,
}));
vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryBreakingNews: "queryBreakingNews",
}));
vi.mock("@/lib/resolve-dynamic-fetch-options", () => ({
  resolveDynamicFetchOptions: mockResolve,
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import {
  CachedBreakingNewsServer,
  DraftAwareBreakingNews,
} from "@/components/breaking-news";
import { BreakingNewsBar } from "@/components/breaking-news-bar";

const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();
const live = () => ({
  label: "Developing",
  expiresAt: inOneHour(),
  article: { title: "Montana hires a coach", slug: "montana-hires" },
});

describe("BreakingNewsBar", () => {
  afterEach(() => vi.useRealTimers());

  it("links to the article with its label", () => {
    render(
      <BreakingNewsBar
        label="Breaking"
        title="Montana hires a coach"
        slug="montana-hires"
        expiresAt={inOneHour()}
      />,
    );
    expect(screen.getByText("Breaking")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Montana hires a coach" }),
    ).toHaveAttribute("href", "/montana-hires");
  });

  it("renders nothing once expired", () => {
    const { container } = render(
      <BreakingNewsBar
        label="Breaking"
        title="Old"
        slug="old"
        expiresAt={new Date(Date.now() - 1000).toISOString()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hides itself when the expiry time passes", () => {
    vi.useFakeTimers();
    const expiresAt = new Date(Date.now() + 5_000).toISOString();
    render(
      <BreakingNewsBar
        label="Breaking"
        title="Soon gone"
        slug="s"
        expiresAt={expiresAt}
      />,
    );
    expect(screen.getByText("Soon gone")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5_001);
    });
    expect(screen.queryByText("Soon gone")).not.toBeInTheDocument();
  });

  it("hides when the expiry changes to the past", () => {
    const { rerender } = render(
      <BreakingNewsBar
        label="Breaking"
        title="Changed"
        slug="c"
        expiresAt={inOneHour()}
      />,
    );
    rerender(
      <BreakingNewsBar
        label="Breaking"
        title="Changed"
        slug="c"
        expiresAt={new Date(Date.now() - 1).toISOString()}
      />,
    );
    expect(screen.queryByText("Changed")).not.toBeInTheDocument();
  });
});

describe("CachedBreakingNewsServer", () => {
  beforeEach(() => mockCachedSanity.mockReset());

  it("renders the live banner", async () => {
    mockCachedSanity.mockResolvedValue({ data: live() });
    render(
      (await CachedBreakingNewsServer({
        perspective: "published",
        stega: false,
      })) as ReactElement,
    );
    expect(screen.getByText("Developing")).toBeInTheDocument();
  });

  it("renders nothing without a live alert or a published article", async () => {
    for (const data of [
      null,
      { ...live(), article: null },
      { ...live(), article: { title: "No slug", slug: null } },
      { ...live(), article: { title: null, slug: "no-title" } },
    ]) {
      mockCachedSanity.mockResolvedValueOnce({ data });
      expect(
        await CachedBreakingNewsServer({
          perspective: "published",
          stega: false,
        }),
      ).toBeNull();
    }
  });

  it("uses draft-aware options in preview", async () => {
    mockResolve.mockResolvedValue({ perspective: "drafts", stega: true });
    mockCachedSanity.mockResolvedValue({ data: live() });
    render((await DraftAwareBreakingNews()) as ReactElement);
    expect(mockCachedSanity).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "drafts", stega: true }),
    );
  });
});
