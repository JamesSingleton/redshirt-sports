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
  schoolRankingsDisplayChanged,
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

describe("schoolRankingsDisplayChanged", () => {
  const current = {
    name: "Montana State",
    shortName: "Montana State",
    abbreviation: "MTST",
    slug: "montana-state-bobcats",
    image: null,
    top25Eligible: true,
  };

  it("is true for a new top-25-eligible school", () => {
    expect(
      schoolRankingsDisplayChanged(null, {
        ...current,
        top25Eligible: true,
      }),
    ).toBe(true);
  });

  it("is false for a new school that is not top-25 eligible", () => {
    expect(
      schoolRankingsDisplayChanged(null, {
        ...current,
        top25Eligible: false,
      }),
    ).toBe(false);
  });

  it("detects display field and logo changes", () => {
    expect(
      schoolRankingsDisplayChanged(current, { ...current, name: "New Name" }),
    ).toBe(true);
    expect(
      schoolRankingsDisplayChanged(current, {
        ...current,
        image: { asset: { _ref: "image-1" } },
      }),
    ).toBe(true);
  });

  it("is false when display fields are unchanged", () => {
    expect(schoolRankingsDisplayChanged(current, { ...current })).toBe(false);
  });

  it("stringifies non-serializable logo values safely", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(
      schoolRankingsDisplayChanged(
        { ...current, image: circular },
        { ...current, image: { asset: { _ref: "image-2" } } },
      ),
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
