import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import Onboarding from "@/components/forms/onboarding";

const { mockPush, mockReload, mockCompleteOnboarding, mockSearchParams } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockReload: vi.fn(),
    mockCompleteOnboarding: vi.fn(),
    mockSearchParams: vi.fn(
      () => new URLSearchParams("redirect_url=/dashboard"),
    ),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("@redshirt-sports/auth/client", () => ({
  useUser: () => ({
    user: { reload: mockReload },
  }),
}));

vi.mock("@/actions/complete-onboarding", () => ({
  completeOnboarding: mockCompleteOnboarding,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("Onboarding", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReload.mockReset();
    mockCompleteOnboarding.mockReset();
  });

  it("submits organization details successfully", async () => {
    mockCompleteOnboarding.mockResolvedValue({ message: "ok" });
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.type(
      screen.getByPlaceholderText("Enter your organization's name"),
      "Redshirt Sports",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your job title or role"),
      "Editor",
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Onboarding completed successfully!",
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows an error toast when onboarding fails", async () => {
    mockCompleteOnboarding.mockResolvedValue({ error: "Something went wrong" });
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.type(
      screen.getByPlaceholderText("Enter your organization's name"),
      "RS",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your job title or role"),
      "Writer",
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("skips redirect when no redirect_url search param is present", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockCompleteOnboarding.mockResolvedValue({ message: "ok" });
    const user = userEvent.setup();
    render(<Onboarding />);

    await user.type(
      screen.getByPlaceholderText("Enter your organization's name"),
      "Redshirt Sports",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your job title or role"),
      "Editor",
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
