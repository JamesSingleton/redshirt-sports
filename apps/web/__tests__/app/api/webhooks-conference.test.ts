const { mockUpsertConference } = vi.hoisted(() => ({
  mockUpsertConference: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  upsertConferenceFromSanity: mockUpsertConference,
}));

vi.mock("@/env", () => ({
  env: {
    CONFERENCE_SYNC_SECRET: "conference_sync_secret",
    SCHOOL_SYNC_SECRET: "school_sync_secret",
  },
}));

import { POST } from "@/app/api/webhooks/sanity/conference/route";

const conference = {
  _id: "sanity-big-sky",
  name: "Big Sky Conference",
  shortName: "Big Sky",
  abbreviation: "BSC",
  slug: "big-sky-conference",
  divisionSanityId: "sanity-d1",
  sportIds: ["football", "mens-basketball"],
  subdivisions: [
    { sportId: "football", subdivisionId: "sanity-fcs" },
    { sportId: "mens-basketball", subdivisionId: "sanity-mid-major" },
  ],
};

const post = (body: unknown, authorization = "Bearer conference_sync_secret") =>
  POST(
    new Request("http://localhost/api/webhooks/sanity/conference", {
      method: "POST",
      headers: authorization ? { Authorization: authorization } : {},
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/webhooks/sanity/conference", () => {
  beforeEach(() => {
    mockUpsertConference.mockReset().mockResolvedValue({
      action: "updated",
      id: "db-big-sky",
      divisionFound: true,
      sports: 2,
      subdivisions: { replaced: 2, skipped: [] },
    });
  });

  it("rejects a missing, wrong, or non-bearer secret", async () => {
    expect((await post({ conference }, "")).status).toBe(401);
    expect((await post({ conference }, "Bearer wrong")).status).toBe(401);
    expect(
      (await post({ conference }, "Basic conference_sync_secret")).status,
    ).toBe(401);
    expect(mockUpsertConference).not.toHaveBeenCalled();
  });

  it("refuses the school sync's secret", async () => {
    expect(
      (await post({ conference }, "Bearer school_sync_secret")).status,
    ).toBe(401);
    expect(mockUpsertConference).not.toHaveBeenCalled();
  });

  it("rejects a payload without an id", async () => {
    const res = await post({ conference: { name: "No id" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid payload");
  });

  it("upserts the conference with its sports and subdivisions", async () => {
    const res = await post({ conference });

    expect(res.status).toBe(200);
    expect(mockUpsertConference).toHaveBeenCalledWith({
      sanityId: "sanity-big-sky",
      name: "Big Sky Conference",
      shortName: "Big Sky",
      abbreviation: "BSC",
      slug: "big-sky-conference",
      divisionSanityId: "sanity-d1",
      sportIds: ["football", "mens-basketball"],
      subdivisions: conference.subdivisions,
    });
    expect(await res.json()).toEqual({
      ok: true,
      action: "updated",
      id: "db-big-sky",
      sports: 2,
      subdivisions: 2,
      skippedSubdivisions: 0,
    });
  });

  it("leaves sports and subdivisions alone when they aren't sent, and clears them on null", async () => {
    mockUpsertConference.mockResolvedValue({
      action: "inserted",
      id: "db-new",
      divisionFound: true,
      sports: null,
      subdivisions: null,
    });

    const absent = await post({ conference: { _id: "sanity-new" } });
    expect(mockUpsertConference).toHaveBeenLastCalledWith(
      expect.objectContaining({ sportIds: undefined, subdivisions: undefined }),
    );
    expect(await absent.json()).toMatchObject({
      subdivisions: null,
      skippedSubdivisions: 0,
    });

    await post({
      conference: { _id: "sanity-new", sportIds: null, subdivisions: null },
    });
    expect(mockUpsertConference).toHaveBeenLastCalledWith(
      expect.objectContaining({ sportIds: [], subdivisions: [] }),
    );
  });

  it("reports a division or subdivisions Postgres doesn't have", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const skipped = [{ sportId: "football", subdivisionId: "sanity-new" }];
    mockUpsertConference.mockResolvedValue({
      action: "updated",
      id: "db-big-sky",
      divisionFound: false,
      sports: 2,
      subdivisions: { replaced: 1, skipped },
    });

    const res = await post({ conference });

    expect(await res.json()).toMatchObject({ skippedSubdivisions: 1 });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("admin division loader"),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("admin subdivision loader"),
      skipped,
    );
    warn.mockRestore();
  });
});
