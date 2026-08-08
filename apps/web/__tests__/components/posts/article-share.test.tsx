import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  LargeArticleSocialShare,
  SmallArticleSocialShare,
} from "@/components/posts/article-share";

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

describe("Article share components", () => {
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

  it("copies the article URL in the large share card", async () => {
    render(
      <LargeArticleSocialShare slug="big-game" title="Big Game Preview" />,
    );

    expect(screen.getByDisplayValue("https://redshirtsports.com/big-game"));
    fireEvent.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://redshirtsports.com/big-game",
      );
      expect(
        screen.getByRole("button", { name: /Copied!/i }),
      ).toBeInTheDocument();
    });
  });

  it("opens social share windows from the large card", async () => {
    const user = userEvent.setup();
    render(
      <LargeArticleSocialShare slug="big-game" title="Big Game Preview" />,
    );

    await user.click(screen.getByRole("button", { name: "Share on X" }));
    await user.click(screen.getByRole("button", { name: "Share on Facebook" }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("twitter.com/intent/tweet"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("facebook.com/sharer"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("renders the small share layout and copies the URL", async () => {
    render(<SmallArticleSocialShare slug="mobile-game" title="Mobile Game" />);

    expect(screen.getByText("Share this article")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Copy/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://redshirtsports.com/mobile-game",
      );
    });
  });

  it("opens social share windows from the small layout", async () => {
    const user = userEvent.setup();
    render(<SmallArticleSocialShare slug="mobile-game" title="Mobile Game" />);

    await user.click(screen.getByRole("button", { name: "Share on X" }));
    await user.click(screen.getByRole("button", { name: "Share on Facebook" }));

    expect(openSpy).toHaveBeenCalledTimes(2);
  });

  it("resets copied state after the clipboard timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(
        <LargeArticleSocialShare slug="big-game" title="Big Game Preview" />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Copy/i }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Copied!/i }),
        ).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /^Copy$/i }),
        ).toBeInTheDocument();
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
