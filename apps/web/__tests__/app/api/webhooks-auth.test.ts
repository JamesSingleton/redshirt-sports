const {
  mockCreateUser,
  mockUpdateUser,
  mockRevokeAssignments,
  mockAnalyticsCapture,
  mockAnalyticsIdentify,
  mockVerify,
  mockHeadersGet,
} = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockRevokeAssignments: vi.fn(),
  mockAnalyticsCapture: vi.fn(),
  mockAnalyticsIdentify: vi.fn(),
  mockVerify: vi.fn(),
  mockHeadersGet: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  revokeAssignmentsForNonVoters: mockRevokeAssignments,
}));

vi.mock("@redshirt-sports/analytics/server", () => ({
  analytics: {
    capture: mockAnalyticsCapture,
    identify: mockAnalyticsIdentify,
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: mockHeadersGet,
  }),
}));

vi.mock("svix", () => ({
  Webhook: class MockWebhook {
    verify(...args: unknown[]) {
      return mockVerify(...args);
    }
  },
}));

import { POST } from "@/app/api/webhooks/auth/route";

function setSvixHeaders(present = true) {
  mockHeadersGet.mockImplementation((name: string) => {
    if (!present) return null;
    if (name === "svix-id") return "msg_1";
    if (name === "svix-timestamp") return "1234567890";
    if (name === "svix-signature") return "v1,sig";
    return null;
  });
}

describe("POST /api/webhooks/auth", () => {
  const originalSecret = process.env.CLERK_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
    mockCreateUser.mockReset().mockResolvedValue(undefined);
    mockUpdateUser.mockReset().mockResolvedValue(undefined);
    mockRevokeAssignments.mockReset().mockResolvedValue(undefined);
    mockAnalyticsCapture.mockReset();
    mockAnalyticsIdentify.mockReset();
    mockVerify.mockReset();
    mockHeadersGet.mockReset();
    setSvixHeaders(true);
  });

  afterEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = originalSecret;
  });

  it("returns 400 when svix headers are missing", async () => {
    setSvixHeaders(false);
    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: JSON.stringify({ type: "user.created", data: {} }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("creates user and captures analytics on user.created", async () => {
    mockVerify.mockReturnValue({
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Doe",
      },
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith({
      id: "user_1",
      firstName: "Jane",
      lastName: "Doe",
    });
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      expect.objectContaining({ event: "user_created" }),
    );
    expect(mockAnalyticsIdentify).toHaveBeenCalled();
  });

  it("revokes poll assignments when isVoter becomes false", async () => {
    mockVerify.mockReturnValue({
      type: "user.updated",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Doe",
        public_metadata: {
          isVoter: false,
          isAdmin: false,
        },
      },
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_1", isVoter: false }),
    );
    expect(mockRevokeAssignments).toHaveBeenCalledWith("user_1");
  });

  it("does not revoke assignments when isVoter is true", async () => {
    mockVerify.mockReturnValue({
      type: "user.updated",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Doe",
        public_metadata: {
          isVoter: true,
        },
      },
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(200);
    expect(mockRevokeAssignments).not.toHaveBeenCalled();
  });

  it("returns 501 for unsupported event types", async () => {
    mockVerify.mockReturnValue({
      type: "session.created",
      data: {},
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(501);
  });
});
