import { fireEvent, render, screen } from "@testing-library/react";

const { mockCapture } = vi.hoisted(() => ({ mockCapture: vi.fn() }));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import {
  ArticleShareToolbar,
  LargeArticleSocialShare,
  SmallArticleSocialShare,
} from "@/components/posts/article-share";

describe("share_clicked analytics", () => {
  beforeEach(() => {
    mockCapture.mockClear();
    vi.spyOn(window, "open").mockImplementation(() => null);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tracks X and Facebook shares", () => {
    render(<LargeArticleSocialShare slug="big-game" title="Big Game" />);

    fireEvent.click(screen.getByRole("button", { name: "Share on X" }));
    fireEvent.click(screen.getByRole("button", { name: "Share on Facebook" }));

    expect(mockCapture).toHaveBeenCalledWith("share_clicked", {
      method: "twitter",
      slug: "big-game",
    });
    expect(mockCapture).toHaveBeenCalledWith("share_clicked", {
      method: "facebook",
      slug: "big-game",
    });
  });

  it("tracks copy-link in both share cards", () => {
    const { unmount } = render(
      <LargeArticleSocialShare slug="big-game" title="Big Game" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    unmount();

    render(<SmallArticleSocialShare slug="big-game" title="Big Game" />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(
      mockCapture.mock.calls.filter(
        ([event, props]) =>
          event === "share_clicked" && props.method === "copy_link",
      ),
    ).toHaveLength(2);
  });

  it("tracks the toolbar share button", () => {
    render(<ArticleShareToolbar slug="big-game" title="Big Game" />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(mockCapture).toHaveBeenCalledWith("share_clicked", {
      method: "native_share",
      slug: "big-game",
    });
  });
});
