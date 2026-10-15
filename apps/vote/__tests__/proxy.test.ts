import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { handleVoteProxy } from "@/proxy";

function makeRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3002"));
}

function createAuth(userId: string | null) {
  const protect = vi.fn(async () => undefined);
  const auth = Object.assign(async () => ({ userId }), { protect });
  return { auth, protect };
}

describe("handleVoteProxy", () => {
  it("sends a signed-out visitor on /ballot to sign-in", async () => {
    const { auth, protect } = createAuth(null);
    const res = await handleVoteProxy(
      auth,
      makeRequest("/ballot/fcs/2026/week-1"),
    );
    expect(protect).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/sign-in");
    expect(location).toContain("redirect_url=");
  });

  it("lets a signed-in voter open a ballot", async () => {
    const { auth } = createAuth("user_1");
    const res = await handleVoteProxy(
      auth,
      makeRequest("/ballot/fcs/2026/week-1"),
    );
    expect(res.status).toBe(200);
  });

  it("leaves /invite public", async () => {
    const { auth, protect } = createAuth(null);
    const res = await handleVoteProxy(auth, makeRequest("/invite/token"));
    expect(protect).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
