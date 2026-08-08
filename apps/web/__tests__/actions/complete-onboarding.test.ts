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
      users: { updateUserMetadata },
    });

    const formData = new FormData();
    formData.set("organizationName", "ACME");
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

  it("returns the Error message when Clerk throws an Error", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockClerkClient.mockResolvedValue({
      users: {
        updateUserMetadata: vi.fn().mockRejectedValue(new Error("Clerk down")),
      },
    });

    const formData = new FormData();
    await expect(completeOnboarding(formData)).resolves.toEqual({
      error: "Clerk down",
    });
  });

  it("returns a fallback message for non-Error throws", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockClerkClient.mockResolvedValue({
      users: {
        updateUserMetadata: vi.fn().mockRejectedValue("boom"),
      },
    });

    const formData = new FormData();
    await expect(completeOnboarding(formData)).resolves.toEqual({
      error: "There was an error updating your user.",
    });
  });
});
