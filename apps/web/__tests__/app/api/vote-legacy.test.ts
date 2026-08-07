import { POST } from "@/app/api/vote/route";

const { mockAuth } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  return { mockAuth };
});

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: mockAuth,
}));

describe("POST /api/vote (legacy)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST();
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("returns 410 with retirement message when authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1" });

    const res = await POST();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.error).toMatch(/retired/i);
    expect(body.error).toMatch(/\/api\/vote\/college\//);
  });
});
