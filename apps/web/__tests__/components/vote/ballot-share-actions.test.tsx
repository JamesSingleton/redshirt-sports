import { render, screen } from "@testing-library/react";
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

describe("BallotShareActions", () => {
  beforeEach(() => {
    mockCapture.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockToastMessage.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["png"], { type: "image/png" }),
      }),
    );
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("downloads a share image and tracks analytics", async () => {
    const user = userEvent.setup();
    render(<BallotShareActions sport="football" division="fcs" week={5} />);

    await user.click(screen.getByRole("button", { name: /Download image/i }));

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
  });
});
