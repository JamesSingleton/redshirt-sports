const { mockGetSchoolDisplay, mockUpsertSchool, mockRevalidateTag } =
  vi.hoisted(() => ({
    mockGetSchoolDisplay: vi.fn(),
    mockUpsertSchool: vi.fn(),
    mockRevalidateTag: vi.fn(),
  }));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSchoolRankingsDisplayBySanityId: mockGetSchoolDisplay,
  upsertSchoolFromSanity: mockUpsertSchool,
}));

vi.mock("@/env", () => ({
  env: {
    SCHOOL_SYNC_SECRET: "school_sync_secret",
  },
}));

vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return {
    ...actual,
    revalidateTag: mockRevalidateTag,
  };
});

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (fn: () => void) => {
      fn();
    },
  };
});

import { POST } from "@/app/api/webhooks/sanity/school/route";

const validPayload = {
  school: {
    _id: "sanity-school-1",
    name: "Montana State",
    shortName: "Montana State",
    abbreviation: "MTST",
    nickname: "Bobcats",
    slug: "montana-state-bobcats",
    top25VotingEligible: true,
  },
};

describe("POST /api/webhooks/sanity/school", () => {
  beforeEach(() => {
    mockGetSchoolDisplay.mockReset().mockResolvedValue({
      name: "Montana State",
      shortName: "Montana State",
      abbreviation: "MTST",
      slug: "montana-state-bobcats",
      image: null,
      top25Eligible: true,
    });
    mockUpsertSchool.mockReset().mockResolvedValue({
      action: "updated",
      id: "db-school-1",
    });
    mockRevalidateTag.mockReset();
  });

  it("returns 401 for missing or wrong bearer token", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer wrong" },
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization is not a bearer token", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Basic school_sync_secret" },
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization header is missing", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify({ school: { name: "Missing id" } }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid payload");
  });

  it("upserts school and expires rankings when display fields change", async () => {
    mockGetSchoolDisplay.mockResolvedValue({
      name: "Old Name",
      shortName: "Montana State",
      abbreviation: "MTST",
      slug: "montana-state-bobcats",
      image: null,
      top25Eligible: true,
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("rankings", { expire: 0 });
  });

  it("does not expire rankings when only nickname changes", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify({
          school: { ...validPayload.school, nickname: "New nickname only" },
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("coalesces omitted display fields to null without expiring rankings", async () => {
    mockGetSchoolDisplay.mockResolvedValue({
      name: null,
      shortName: null,
      abbreviation: null,
      slug: null,
      image: null,
      top25Eligible: false,
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify({
          school: {
            _id: "sanity-school-1",
            top25VotingEligible: false,
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("treats explicit null top-25 eligibility in the payload", async () => {
    mockGetSchoolDisplay.mockResolvedValue({
      name: "Montana State",
      shortName: "Montana State",
      abbreviation: "MTST",
      slug: "montana-state-bobcats",
      image: null,
      top25Eligible: null,
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify({
          school: {
            ...validPayload.school,
            top25VotingEligible: null,
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("expires rankings when a new school becomes top-25 eligible", async () => {
    mockGetSchoolDisplay.mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify({
          school: {
            _id: "sanity-school-1",
            top25VotingEligible: true,
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("rankings", { expire: 0 });
  });

  it("does not expire rankings when unauthorized", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer wrong" },
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(401);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});
