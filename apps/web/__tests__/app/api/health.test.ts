import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns liveness ok", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });
});
