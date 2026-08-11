import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockCapture, mockToastSuccess, mockToastError, mockToastMessage } =
  vi.hoisted(() => ({
    mockCapture: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
    mockToastMessage: vi.fn(),
  }));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
    message: mockToastMessage,
  },
}));

import { BallotShareActions } from "@/components/vote/ballot-share-actions";

function stubObjectUrls() {
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:mock"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
}

function stubFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["png"], { type: "image/png" }),
    }),
  );
}

describe("BallotShareActions", () => {
  beforeEach(() => {
    mockCapture.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockToastMessage.mockReset();
    stubFetchOk();
    stubObjectUrls();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("downloads a share image and tracks analytics", async () => {
    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(screen.getByRole("button", { name: /Download image/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/vote/college/football/rankings/fcs/share-image",
      );
      expect(mockCapture).toHaveBeenCalledWith(
        "ballot_image_shared",
        expect.objectContaining({
          platform: "download",
          sport: "football",
          division: "fcs",
          week: 5,
        }),
      );
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  it("shows API error message when download fails with JSON error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Too many share image requests" }),
      }),
    );
    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(screen.getByRole("button", { name: /Download image/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Too many share image requests",
      );
    });
  });

  it("shows fallback error when download fails without JSON error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("bad json");
        },
      }),
    );
    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(screen.getByRole("button", { name: /Download image/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to generate share image",
      );
    });
  });

  it("shows generic download error for non-Error throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("network down"));
    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(screen.getByRole("button", { name: /Download image/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to download ballot image",
      );
    });
  });

  it("opens an X intent with prefilled text", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(screen.getByRole("button", { name: /Post on X/i }));

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("twitter.com/intent/tweet"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(mockCapture).toHaveBeenCalledWith(
      "ballot_image_shared",
      expect.objectContaining({ platform: "x_intent" }),
    );
    expect(mockToastMessage).toHaveBeenCalled();
  });

  it("shows native Share button and shares a file", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare,
    });

    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    const shareButton = await screen.findByRole("button", { name: /^Share$/i });
    await user.click(shareButton);

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          files: expect.any(Array),
          title: expect.stringContaining("Top 25"),
          text: expect.stringContaining("Top 25"),
        }),
      );
      expect(mockCapture).toHaveBeenCalledWith(
        "ballot_image_shared",
        expect.objectContaining({ platform: "native_share" }),
      );
    });
  });

  it("ignores AbortError from native share", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare: vi.fn().mockReturnValue(true),
    });

    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(await screen.findByRole("button", { name: /^Share$/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    expect(mockToastError).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalledWith(
      "ballot_image_shared",
      expect.objectContaining({ platform: "native_share" }),
    );
  });

  it("toasts when native share fails with a non-abort error", async () => {
    const share = vi.fn().mockRejectedValue(new Error("Share failed"));
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare: vi.fn().mockReturnValue(true),
    });

    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(await screen.findByRole("button", { name: /^Share$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Share failed");
    });
  });

  it("toasts generic share error for non-Error throws", async () => {
    const share = vi.fn().mockRejectedValue("nope");
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      canShare: vi.fn().mockReturnValue(true),
    });

    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(await screen.findByRole("button", { name: /^Share$/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to share ballot image",
      );
    });
  });

  it("hides Share when canShare throws", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      share: vi.fn(),
      canShare: vi.fn(() => {
        throw new Error("unsupported");
      }),
    });

    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /^Share$/i }),
      ).not.toBeInTheDocument();
    });
  });
});
