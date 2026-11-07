const {
  mockCreateUser,
  mockUpdateUser,
  mockDeactivateUser,
  mockGetUserDisplayFields,
  mockRevokeAssignments,
  mockAnalyticsCapture,
  mockAnalyticsIdentify,
  mockVerify,
  mockHeadersGet,
  mockRevalidateTag,
  mockSentryCapture,
} = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockDeactivateUser: vi.fn(),
  mockGetUserDisplayFields: vi.fn(),
  mockRevokeAssignments: vi.fn(),
  mockAnalyticsCapture: vi.fn(),
  mockAnalyticsIdentify: vi.fn(),
  mockVerify: vi.fn(),
  mockHeadersGet: vi.fn(),
  mockRevalidateTag: vi.fn(),
  mockSentryCapture: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deactivateUser: mockDeactivateUser,
  getUserDisplayFields: mockGetUserDisplayFields,
  revokeAssignmentsForNonVoters: mockRevokeAssignments,
}));

vi.mock("@redshirt-sports/analytics/server", () => ({
  analytics: {
    capture: mockAnalyticsCapture,
    identify: mockAnalyticsIdentify,
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockSentryCapture,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: mockHeadersGet,
  }),
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

vi.mock("svix", () => ({
  Webhook: class MockWebhook {
    verify(...args: unknown[]) {
      return mockVerify(...args);
    }
  },
}));

vi.mock("@/env", () => ({
  env: {
    get CLERK_WEBHOOK_SECRET() {
      return process.env.CLERK_WEBHOOK_SECRET;
    },
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

function postWebhook(body: unknown) {
  return POST(
    new Request("http://localhost/api/webhooks/auth", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/webhooks/auth", () => {
  const originalSecret = process.env.CLERK_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test";
    mockCreateUser.mockReset().mockResolvedValue(undefined);
    mockUpdateUser.mockReset().mockResolvedValue(undefined);
    mockDeactivateUser.mockReset().mockResolvedValue(undefined);
    mockSentryCapture.mockReset();
    mockGetUserDisplayFields.mockReset().mockResolvedValue(undefined);
    mockRevokeAssignments.mockReset().mockResolvedValue(undefined);
    mockAnalyticsCapture.mockReset();
    mockAnalyticsIdentify.mockReset();
    mockVerify.mockReset();
    mockHeadersGet.mockReset();
    mockRevalidateTag.mockReset();
    setSvixHeaders(true);
  });

  afterEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = originalSecret;
  });

  it("returns 400 when svix headers are missing", async () => {
    setSvixHeaders(false);
    const res = await postWebhook({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const res = await postWebhook({ type: "user.created", data: {} });
    expect(res.status).toBe(400);
  });

  it("creates user and captures analytics on user.created", async () => {
    const res = await postWebhook({
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Doe",
      },
    });

    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith({
      id: "user_1",
      firstName: "Jane",
      lastName: "Doe",
      organization: undefined,
      organizationRole: undefined,
      isAdmin: undefined,
      isVoter: false,
    });
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      expect.objectContaining({ event: "user_created" }),
    );
    expect(mockAnalyticsIdentify).toHaveBeenCalled();
  });

  it("defaults null first/last names to empty strings on user.created", async () => {
    const res = await postWebhook({
      type: "user.created",
      data: {
        id: "user_2",
        first_name: null,
        last_name: null,
      },
    });

    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_2",
        firstName: "",
        lastName: "",
      }),
    );
  });

  it("stores public metadata set at creation on user.created", async () => {
    const res = await postWebhook({
      type: "user.created",
      data: {
        id: "user_4",
        first_name: "Pat",
        last_name: "Lee",
        public_metadata: {
          isVoter: true,
          isAdmin: true,
          organization: "ESPN",
          organizationRole: "Analyst",
        },
      },
    });

    expect(res.status).toBe(200);
    expect(mockCreateUser).toHaveBeenCalledWith({
      id: "user_4",
      firstName: "Pat",
      lastName: "Lee",
      organization: "ESPN",
      organizationRole: "Analyst",
      isAdmin: true,
      isVoter: true,
    });
  });

  it("verifies the raw request body, byte for byte", async () => {
    const raw =
      '{"type":"user.created","data":{"id":"user_5","first_name":"Ren\\u00e9","last_name":"D"}}';
    const res = await POST(
      new Request("http://localhost/api/webhooks/auth", {
        method: "POST",
        body: raw,
      }),
    );

    expect(res.status).toBe(200);
    expect(mockVerify).toHaveBeenCalledWith(raw, expect.any(Object));
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_5", firstName: "René" }),
    );
  });

  it("treats a non-boolean isVoter as not a voter", async () => {
    const res = await postWebhook({
      type: "user.updated",
      data: {
        id: "user_6",
        first_name: "A",
        last_name: "B",
        public_metadata: { isVoter: "false" },
      },
    });

    expect(res.status).toBe(200);
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_6", isVoter: false }),
    );
    expect(mockRevokeAssignments).toHaveBeenCalledWith("user_6");
  });

  it("deactivates the user and revokes assignments on user.deleted", async () => {
    const res = await postWebhook({
      type: "user.deleted",
      data: { id: "user_7", deleted: true, object: "user" },
    });

    expect(res.status).toBe(200);
    expect(mockDeactivateUser).toHaveBeenCalledWith("user_7");
    expect(mockRevokeAssignments).toHaveBeenCalledWith("user_7");
  });

  it("acknowledges user.deleted without an id", async () => {
    const res = await postWebhook({
      type: "user.deleted",
      data: { deleted: true, object: "user" },
    });

    expect(res.status).toBe(200);
    expect(mockDeactivateUser).not.toHaveBeenCalled();
  });

  it("defaults null first/last names to empty strings on user.updated", async () => {
    const res = await postWebhook({
      type: "user.updated",
      data: {
        id: "user_3",
        first_name: null,
        last_name: null,
        public_metadata: {
          isVoter: true,
        },
      },
    });

    expect(res.status).toBe(200);
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_3",
        firstName: "",
        lastName: "",
      }),
    );
  });

  it("revokes poll assignments when isVoter becomes false", async () => {
    const res = await postWebhook({
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

    expect(res.status).toBe(200);
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_1", isVoter: false }),
    );
    expect(mockRevokeAssignments).toHaveBeenCalledWith("user_1");
  });

  it("does not revoke assignments when isVoter is true", async () => {
    const res = await postWebhook({
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

    expect(res.status).toBe(200);
    expect(mockRevokeAssignments).not.toHaveBeenCalled();
  });

  it("expires rankings cache when a voter display field changes", async () => {
    mockGetUserDisplayFields.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      organization: "ESPN",
      organizationRole: "Analyst",
    });

    const res = await postWebhook({
      type: "user.updated",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Smith",
        public_metadata: {
          isVoter: true,
          organization: "ESPN",
          organizationRole: "Analyst",
        },
      },
    });

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalledWith("rankings", "max");
  });

  it("does not expire rankings cache when only voter credentials change", async () => {
    mockGetUserDisplayFields.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      organization: "ESPN",
      organizationRole: "Analyst",
    });

    const res = await postWebhook({
      type: "user.updated",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Doe",
        public_metadata: {
          isVoter: false,
          organization: "ESPN",
          organizationRole: "Analyst",
        },
      },
    });

    expect(res.status).toBe(200);
    expect(mockRevokeAssignments).toHaveBeenCalledWith("user_1");
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it("returns 500 without leaking the error when the handler throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateUser.mockRejectedValue(new Error("database down"));

    const res = await postWebhook({
      type: "user.created",
      data: {
        id: "user_1",
        first_name: "Jane",
        last_name: "Doe",
      },
    });

    expect(res.status).toBe(500);
    await expect(res.text()).resolves.toBe("Webhook handler failed");
    expect(mockSentryCapture).toHaveBeenCalled();
  });

  it("acknowledges unsupported event types with 200 so Svix does not retry", async () => {
    const res = await postWebhook({
      type: "session.created",
      data: {},
    });
    expect(res.status).toBe(200);
  });

  it("throws when webhook secret is missing", async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;
    await expect(postWebhook({})).rejects.toThrow(/WEBHOOK_SECRET/);
  });
});
