const { mockIsEnabled } = vi.hoisted(() => ({ mockIsEnabled: vi.fn() }));

vi.mock("@/lib/transfer-portal", () => ({
  isTransferPortalEnabled: mockIsEnabled,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import TransferPortalLayout, {
  metadata,
} from "@/app/college/[sport]/transfer-portal/layout";

describe("TransferPortalLayout", () => {
  it("keeps the portal out of search indexes", () => {
    expect(metadata).toEqual({ robots: { index: false, follow: false } });
  });

  it("404s when the portal is disabled", () => {
    mockIsEnabled.mockReturnValue(false);
    expect(() => TransferPortalLayout({ children: "wire" })).toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders children when the portal is enabled", () => {
    mockIsEnabled.mockReturnValue(true);
    expect(TransferPortalLayout({ children: "wire" })).toBe("wire");
  });
});
