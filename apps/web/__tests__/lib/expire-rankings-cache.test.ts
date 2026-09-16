const { mockRevalidateTag, mockAfter } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
  mockAfter: vi.fn((fn: () => void) => {
    fn();
  }),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

vi.mock("next/server", () => ({
  after: mockAfter,
}));

import {
  expireRankingsCache,
  rankingsVoterDisplayChanged,
} from "@/lib/expire-rankings-cache";

describe("rankingsVoterDisplayChanged", () => {
  const current = {
    firstName: "Jane",
    lastName: "Doe",
    organization: "ESPN",
    organizationRole: "Analyst",
  };

  it("is false when the user row does not exist yet", () => {
    expect(rankingsVoterDisplayChanged(undefined, current)).toBe(false);
  });

  it("is false when display fields are unchanged", () => {
    expect(rankingsVoterDisplayChanged(current, { ...current })).toBe(false);
  });

  it("treats null and undefined organization as equal", () => {
    expect(
      rankingsVoterDisplayChanged(
        { ...current, organization: null, organizationRole: null },
        { firstName: "Jane", lastName: "Doe" },
      ),
    ).toBe(false);
  });

  it("is true when name, organization, or role changes", () => {
    expect(
      rankingsVoterDisplayChanged(current, { ...current, lastName: "Smith" }),
    ).toBe(true);
    expect(
      rankingsVoterDisplayChanged(current, {
        ...current,
        organization: "CBS",
      }),
    ).toBe(true);
    expect(
      rankingsVoterDisplayChanged(current, {
        ...current,
        organizationRole: "Editor",
      }),
    ).toBe(true);
  });
});

describe("expireRankingsCache", () => {
  it("expires the rankings tag after the response", () => {
    mockAfter.mockClear();
    mockRevalidateTag.mockClear();

    expireRankingsCache();

    expect(mockAfter).toHaveBeenCalledOnce();
    expect(mockRevalidateTag).toHaveBeenCalledWith("rankings", { expire: 0 });
  });
});
