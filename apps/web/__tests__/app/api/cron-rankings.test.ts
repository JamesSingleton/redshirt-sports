import { GET } from "@/app/api/cron/college/[sport]/rankings/[division]/route";

describe("GET /api/cron/college/[sport]/rankings/[division]", () => {
  it("returns 404 because cron publish is disabled", async () => {
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/disabled/i);
  });
});
