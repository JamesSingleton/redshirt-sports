const { mockUpsertSchool, mockRevalidateTag } = vi.hoisted(() => ({
  mockUpsertSchool: vi.fn(),
  mockRevalidateTag: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  upsertSchoolFromSanity: mockUpsertSchool,
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
    top25Eligible: true,
  },
};

describe("POST /api/webhooks/sanity/school", () => {
  const originalSecret = process.env.SCHOOL_SYNC_SECRET;

  beforeEach(() => {
    process.env.SCHOOL_SYNC_SECRET = "school_sync_secret";
    mockUpsertSchool.mockReset().mockResolvedValue({
      action: "updated",
      id: "db-school-1",
    });
    mockRevalidateTag.mockReset();
  });

  afterEach(() => {
    process.env.SCHOOL_SYNC_SECRET = originalSecret;
  });

  it("returns 500 when SCHOOL_SYNC_SECRET is not configured", async () => {
    delete process.env.SCHOOL_SYNC_SECRET;
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(500);
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

  it("upserts school and returns ok on valid payload", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/sanity/school", {
        method: "POST",
        headers: { Authorization: "Bearer school_sync_secret" },
        body: JSON.stringify(validPayload),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, action: "updated", id: "db-school-1" });
    expect(mockUpsertSchool).toHaveBeenCalledWith(
      expect.objectContaining({
        sanityId: "sanity-school-1",
        name: "Montana State",
        slug: "montana-state-bobcats",
      }),
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("rankings", { expire: 0 });
  });

  it("does not expire rankings cache when the school webhook is unauthorized", async () => {
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
