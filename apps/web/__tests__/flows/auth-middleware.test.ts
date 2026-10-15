import { NextRequest } from "next/server";

import { handleAuthProxy } from "@/proxy";

function makeRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function createAuth(options: {
  userId: string | null;
  onboardingComplete?: boolean;
  isVoter?: boolean;
  protect?: ReturnType<typeof vi.fn>;
}) {
  const protect = options.protect ?? vi.fn(async () => undefined);
  const authFn = Object.assign(
    async () => ({
      userId: options.userId,
      sessionClaims: options.userId
        ? {
            metadata: {
              onboardingComplete: options.onboardingComplete ?? true,
              isVoter: options.isVoter ?? false,
            },
          }
        : null,
    }),
    { protect: protect as () => Promise<unknown> },
  );
  return { auth: authFn, protect };
}

describe("handleAuthProxy", () => {
  it("calls protect for /vote routes", async () => {
    const { auth, protect } = createAuth({ userId: "user-1" });
    await handleAuthProxy(auth, makeRequest("/vote/college/football/fbs"));
    expect(protect).toHaveBeenCalled();
  });

  it("calls protect for /admin routes", async () => {
    const { auth, protect } = createAuth({ userId: "user-1" });
    await handleAuthProxy(auth, makeRequest("/admin"));
    expect(protect).toHaveBeenCalled();
  });

  it("does not call protect for /onboarding", async () => {
    const { auth, protect } = createAuth({
      userId: "user-1",
      onboardingComplete: false,
      isVoter: true,
    });
    await handleAuthProxy(auth, makeRequest("/onboarding"));
    expect(protect).not.toHaveBeenCalled();
  });

  it("allows signed-in users on /onboarding without redirecting", async () => {
    const { auth } = createAuth({
      userId: "user-1",
      onboardingComplete: false,
      isVoter: true,
    });
    const res = await handleAuthProxy(auth, makeRequest("/onboarding"));
    expect(res?.status).toBe(200);
    expect(res?.headers.get("location")).toBeNull();
  });

  it("redirects incomplete onboarding users away from non-onboarding routes", async () => {
    const { auth } = createAuth({
      userId: "user-1",
      onboardingComplete: false,
      isVoter: true,
    });
    // /api/vote is matched by middleware but is not a "protected" path
    // that calls protect — however incomplete onboarding still redirects
    // for any non-onboarding route when userId is set.
    // Use a path that is in the matcher conceptually: we call handleAuthProxy
    // directly with any request. Protected routes that aren't onboarding.
    // Actually looking at the code: after protect for /vote, if onboarding
    // incomplete AND not onboarding route → redirect.
    const res = await handleAuthProxy(
      auth,
      makeRequest("/vote/college/football/fbs"),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toContain("/onboarding");
    expect(res?.headers.get("location")).toContain("redirect_url=");
  });

  it("does not send incomplete non-voters to onboarding", async () => {
    const { auth } = createAuth({
      userId: "user-1",
      onboardingComplete: false,
      isVoter: false,
    });
    const res = await handleAuthProxy(
      auth,
      makeRequest("/vote/college/football/fbs"),
    );
    expect(res).toBeUndefined();
  });

  it("sends a non-voter who opens /onboarding back to the home page", async () => {
    const { auth } = createAuth({
      userId: "user-1",
      onboardingComplete: false,
      isVoter: false,
    });
    const res = await handleAuthProxy(auth, makeRequest("/onboarding"));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("does not redirect non-voters at middleware (poll access is page/API)", async () => {
    // No isVoter check — assigned voters and non-voters alike pass middleware
    // when onboarding is complete. Regression: old middleware redirected !isVoter.
    const { auth, protect } = createAuth({
      userId: "user-1",
      onboardingComplete: true,
    });
    const res = await handleAuthProxy(
      auth,
      makeRequest("/vote/college/football/fbs"),
    );
    expect(protect).toHaveBeenCalled();
    expect(res).toBeUndefined();
  });
});
