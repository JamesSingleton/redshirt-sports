import { GET } from "@/app/.well-known/traffic-advice/route";

describe("GET /.well-known/traffic-advice", () => {
  it("allows Chrome's prefetch proxy with the traffic-advice content type", async () => {
    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/trafficadvice+json",
    );
    await expect(res.json()).resolves.toEqual([
      {
        user_agent: "prefetch-proxy",
        google_prefetch_proxy_eap: { fraction: 1 },
      },
    ]);
  });
});
