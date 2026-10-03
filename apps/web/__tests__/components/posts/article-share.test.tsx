import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ArticleShare } from "@/components/posts/article-share";

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

describe("ArticleShare", () => {
  const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    openSpy.mockClear();
    writeText.mockClear();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterAll(() => {
    openSpy.mockRestore();
  });

  it("copies the article URL and confirms the copy", async () => {
    render(<ArticleShare slug="big-game" title="Big Game Preview" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://redshirtsports.com/big-game",
      );
      expect(
        screen.getByRole("button", { name: "Link copied" }),
      ).toBeInTheDocument();
    });
  });

  it("opens X and Facebook share windows with the encoded article URL", async () => {
    const user = userEvent.setup();
    render(<ArticleShare slug="big-game" title="Big Game Preview" />);

    await user.click(screen.getByRole("button", { name: "Share on X" }));
    await user.click(screen.getByRole("button", { name: "Share on Facebook" }));

    const encodedUrl = encodeURIComponent(
      "https://redshirtsports.com/big-game",
    );
    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(openSpy).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent("Big Game Preview")}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(openSpy).toHaveBeenCalledWith(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("resets copied state after the clipboard timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(<ArticleShare slug="big-game" title="Big Game Preview" />);

      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Link copied" }),
        ).toBeInTheDocument();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Copy link" }),
        ).toBeInTheDocument();
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
