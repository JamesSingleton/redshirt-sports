import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { bracketView } from "@/__tests__/helpers/bracket-fixtures";

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  captureImage: vi.fn(),
  capturePdf: vi.fn(),
  downloadBlob: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  frameDetached: false,
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mocks.capture },
}));
vi.mock("@redshirt-sports/ui/components/toast", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));
vi.mock("@/lib/bracket-capture", () => ({
  captureBracketImage: mocks.captureImage,
  captureBracketPdf: mocks.capturePdf,
}));
vi.mock("@/lib/download-blob", () => ({ downloadBlob: mocks.downloadBlob }));
vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span data-testid="logo">{alt}</span>,
}));
vi.mock(
  "@/components/bracket/builder/bracket-export-frame",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/components/bracket/builder/bracket-export-frame")
      >();
    return {
      BracketExportFrame: (
        props: Parameters<typeof original.BracketExportFrame>[0],
      ): ReactNode =>
        mocks.frameDetached ? null : <original.BracketExportFrame {...props} />,
    };
  },
);

import { BracketShareActions } from "@/components/bracket/bracket-share-actions";

function renderActions() {
  return render(
    <BracketShareActions
      view={bracketView()}
      title="2026 FCS Playoff Bracket"
      subtitle="Official bracket"
      division="fcs"
      year={2026}
      logo={undefined}
    />,
  );
}

const exportFrame = () => document.querySelector("[data-print-frame]");

describe("BracketShareActions", () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      if (typeof mock === "function") mock.mockReset();
    }
    mocks.frameDetached = false;
    window.history.replaceState(
      null,
      "",
      "/college/football/playoffs/fcs/2026?game=qf-1",
    );
  });

  afterEach(() => {
    Object.defineProperty(navigator, "share", {
      value: originalShare,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
  });

  it("mounts the export frame only while making a printable PDF", async () => {
    const pdf = new Blob(["pdf"]);
    let frameDuringCapture: Element | null = null;
    mocks.capturePdf.mockImplementation(async (node: Element) => {
      frameDuringCapture = node;
      return pdf;
    });
    renderActions();
    expect(exportFrame()).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Print" }));

    await waitFor(() =>
      expect(mocks.downloadBlob).toHaveBeenCalledWith(
        pdf,
        "redshirt-sports-fcs-playoff-bracket-2026.pdf",
      ),
    );
    expect(frameDuringCapture).toHaveAttribute("data-print-frame");
    expect(mocks.capture).toHaveBeenCalledWith("bracket_page_exported", {
      division: "fcs",
      year: 2026,
      kind: "pdf",
    });
    await waitFor(() => expect(exportFrame()).toBeNull());
    expect(screen.getByRole("button", { name: "Print" })).toBeEnabled();
  });

  it("saves an image", async () => {
    const png = new Blob(["png"]);
    mocks.captureImage.mockResolvedValue(png);
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Save image" }));

    await waitFor(() =>
      expect(mocks.downloadBlob).toHaveBeenCalledWith(
        png,
        "redshirt-sports-fcs-playoff-bracket-2026.png",
      ),
    );
  });

  it("says so when the file can't be made", async () => {
    mocks.capturePdf.mockRejectedValue(new Error("canvas"));
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Print" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Couldn't make the file. Please try again.",
      ),
    );
    expect(mocks.downloadBlob).not.toHaveBeenCalled();
  });

  it("fails cleanly if the export frame never mounts", async () => {
    mocks.frameDetached = true;
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Save image" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled());
    expect(mocks.captureImage).not.toHaveBeenCalled();
  });

  it("opens the share sheet with the page link, without the open matchup", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
    });
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(share).toHaveBeenCalledWith({
      title: "2026 FCS Playoff Bracket",
      url: `${window.location.origin}/college/football/playoffs/fcs/2026`,
    });
    expect(mocks.capture).toHaveBeenCalledWith("bracket_page_shared", {
      division: "fcs",
      year: 2026,
      method: "native",
    });
  });

  it("stays quiet when the share sheet is closed", async () => {
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("AbortError")),
      configurable: true,
    });
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.capture).not.toHaveBeenCalled();
  });

  it("copies the link where there is no share sheet", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/college/football/playoffs/fcs/2026`,
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Link copied");
    expect(mocks.capture).toHaveBeenCalledWith("bracket_page_shared", {
      division: "fcs",
      year: 2026,
      method: "copy",
    });
  });

  it("says so when the link can't be copied", async () => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    renderActions();

    await userEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(mocks.toastError).toHaveBeenCalledWith("Couldn't copy the link.");
  });
});
