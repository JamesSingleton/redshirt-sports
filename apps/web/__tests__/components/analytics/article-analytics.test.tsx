import { render } from "@testing-library/react";

const { mockCapture } = vi.hoisted(() => ({ mockCapture: vi.fn() }));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

import { ArticleAnalytics } from "@/components/analytics/article-analytics";

const baseProps = {
  slug: "big-game-preview",
  title: "Big Game Preview",
  sport: "College Football",
  storyType: "analysis",
  authors: ["Jane Doe", "John Roe"],
  tags: ["FCS"],
  publishedAt: "2026-11-01T12:00:00Z",
};

describe("ArticleAnalytics", () => {
  let trigger: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    mockCapture.mockClear();
    disconnect.mockClear();
    trigger = undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          trigger = cb;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires article_viewed with article metadata", () => {
    render(<ArticleAnalytics {...baseProps} />);

    expect(mockCapture).toHaveBeenCalledWith("article_viewed", {
      slug: "big-game-preview",
      title: "Big Game Preview",
      sport: "College Football",
      story_type: "analysis",
      authors: ["Jane Doe", "John Roe"],
      author: "Jane Doe",
      tags: ["FCS"],
      published_at: "2026-11-01T12:00:00Z",
    });
  });

  it("omits optional metadata when absent", () => {
    render(
      <ArticleAnalytics
        {...baseProps}
        sport={null}
        storyType={null}
        publishedAt={null}
        authors={[]}
      />,
    );

    expect(mockCapture).toHaveBeenCalledWith(
      "article_viewed",
      expect.objectContaining({
        sport: undefined,
        story_type: undefined,
        published_at: undefined,
        author: undefined,
      }),
    );
  });

  it("fires article_read_complete once when the end sentinel is reached", () => {
    render(<ArticleAnalytics {...baseProps} />);
    mockCapture.mockClear();

    trigger?.([{ isIntersecting: false }]);
    expect(mockCapture).not.toHaveBeenCalled();

    trigger?.([{ isIntersecting: true }]);
    expect(mockCapture).toHaveBeenCalledWith(
      "article_read_complete",
      expect.objectContaining({
        slug: "big-game-preview",
        seconds_to_end: expect.any(Number),
      }),
    );
    expect(disconnect).toHaveBeenCalled();
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<ArticleAnalytics {...baseProps} />);
    unmount();

    expect(disconnect).toHaveBeenCalled();
  });

  it("skips read tracking where IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<ArticleAnalytics {...baseProps} />);

    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture).toHaveBeenCalledWith(
      "article_viewed",
      expect.any(Object),
    );
  });
});
