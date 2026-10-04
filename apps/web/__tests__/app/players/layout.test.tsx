const { mockIsEnabled } = vi.hoisted(() => ({ mockIsEnabled: vi.fn() }));

vi.mock("@/lib/transfer-portal", () => ({
  isTransferPortalEnabled: mockIsEnabled,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import PlayersLayout, { metadata } from "@/app/players/layout";

describe("PlayersLayout", () => {
  it("keeps player pages out of search indexes", () => {
    expect(metadata).toEqual({ robots: { index: false, follow: false } });
  });

  it("404s when the portal is disabled", () => {
    mockIsEnabled.mockReturnValue(false);
    expect(() => PlayersLayout({ children: "player" })).toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders children when the portal is enabled", () => {
    mockIsEnabled.mockReturnValue(true);
    expect(PlayersLayout({ children: "player" })).toBe("player");
  });
});
