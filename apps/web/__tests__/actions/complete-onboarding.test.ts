const { mockAuth, mockClerkClient, mockCapture } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockClerkClient: vi.fn(),
  mockCapture: vi.fn(),
}));

vi.mock("@redshirt-sports/auth/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("@redshirt-sports/analytics/server", () => ({
  analytics: { capture: mockCapture },
}));

import { completeOnboarding } from "@/actions/complete-onboarding";

const notOnboarded = vi.fn().mockResolvedValue({ publicMetadata: {} });

function validFormData() {
  const formData = new FormData();
  formData.set("organizationName", "ACME");
  formData.set("organizationRole", "Editor");
  return formData;
}

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no logged in user", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const formData = new FormData();

    await expect(completeOnboarding(formData)).resolves.toEqual({
      error: "No Logged In User",
    });
  });

  it("updates Clerk metadata and captures analytics on success", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const updateUserMetadata = vi.fn().mockResolvedValue({
      publicMetadata: {
        onboardingComplete: true,
        organization: "ACME",
        organizationRole: "Editor",
      },
    });
    mockClerkClient.mockResolvedValue({
      users: { getUser: notOnboarded, updateUserMetadata },
    });

    const formData = new FormData();
    formData.set("organizationName", "  ACME ");
    formData.set("organizationRole", "Editor");

    await expect(completeOnboarding(formData)).resolves.toEqual({
      message: {
        onboardingComplete: true,
        organization: "ACME",
        organizationRole: "Editor",
      },
    });

    expect(updateUserMetadata).toHaveBeenCalledWith("user_1", {
      publicMetadata: {
        onboardingComplete: true,
        organization: "ACME",
        organizationRole: "Editor",
      },
    });
    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: "user_1",
      event: "onboarding_completed",
      properties: {
        organization: "ACME",
        organization_role: "Editor",
      },
    });
  });

  it("returns a generic message when Clerk throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: notOnboarded,
        updateUserMetadata: vi.fn().mockRejectedValue(new Error("Clerk down")),
      },
    });

    await expect(completeOnboarding(validFormData())).resolves.toEqual({
      error: "There was an error updating your user.",
    });
  });

  it("rejects missing organization fields without calling Clerk", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });

    await expect(completeOnboarding(new FormData())).resolves.toEqual({
      error: expect.any(String),
    });
    expect(mockClerkClient).not.toHaveBeenCalled();
  });

  it("rejects overly long organization names", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const formData = validFormData();
    formData.set("organizationName", "x".repeat(101));

    await expect(completeOnboarding(formData)).resolves.toEqual({
      error: "Organization Name must be at most 100 characters",
    });
    expect(mockClerkClient).not.toHaveBeenCalled();
  });

  it("refuses to re-run after onboarding is complete", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const updateUserMetadata = vi.fn();
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: vi
          .fn()
          .mockResolvedValue({ publicMetadata: { onboardingComplete: true } }),
        updateUserMetadata,
      },
    });

    await expect(completeOnboarding(validFormData())).resolves.toEqual({
      error: "Onboarding is already complete",
    });
    expect(updateUserMetadata).not.toHaveBeenCalled();
  });
});
