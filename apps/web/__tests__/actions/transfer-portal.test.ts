const { mockIsEnabled, mockGetSport, mockGetEntries } = vi.hoisted(() => ({
  mockIsEnabled: vi.fn(),
  mockGetSport: vi.fn(),
  mockGetEntries: vi.fn(),
}));

vi.mock("@/lib/transfer-portal", () => ({
  isTransferPortalEnabled: mockIsEnabled,
  getCachedPortalSport: mockGetSport,
  getCachedPortalEntries: mockGetEntries,
}));

import { loadMorePortalEntries } from "@/actions/transfer-portal";

const input = {
  sport: "football",
  portalYear: 2026,
  status: "COMMITTED",
  cursor: "abc",
} as const;

describe("loadMorePortalEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsEnabled.mockReturnValue(true);
  });

  it("throws when the portal is disabled", async () => {
    mockIsEnabled.mockReturnValue(false);
    await expect(loadMorePortalEntries(input)).rejects.toThrow(
      "Transfer portal is not enabled",
    );
    expect(mockGetSport).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    await expect(
      loadMorePortalEntries({ ...input, sport: "hockey" as "football" }),
    ).rejects.toThrow();
    await expect(
      loadMorePortalEntries({ ...input, cursor: "" }),
    ).rejects.toThrow();
    expect(mockGetSport).not.toHaveBeenCalled();
  });

  it("returns an empty page when the sport is missing", async () => {
    mockGetSport.mockResolvedValue(null);
    await expect(loadMorePortalEntries(input)).resolves.toEqual({
      entries: [],
      nextCursor: null,
    });
    expect(mockGetSport).toHaveBeenCalledWith("football");
    expect(mockGetEntries).not.toHaveBeenCalled();
  });

  it("loads the next page for the sport", async () => {
    mockGetSport.mockResolvedValue({ id: "sport-1" });
    mockGetEntries.mockResolvedValue({
      entries: [{ id: "e" }],
      nextCursor: "n",
    });
    await expect(loadMorePortalEntries(input)).resolves.toEqual({
      entries: [{ id: "e" }],
      nextCursor: "n",
    });
    expect(mockGetEntries).toHaveBeenCalledWith({
      ...input,
      sportId: "sport-1",
    });
  });
});
