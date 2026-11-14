import { render, screen } from "@testing-library/react";

import { newsletterSubscribe } from "@/actions/newsletter-subscribe";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";

const { mockUseActionState } = vi.hoisted(() => ({
  mockUseActionState: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useActionState: mockUseActionState };
});

vi.mock("@/actions/newsletter-subscribe", () => ({
  newsletterSubscribe: vi.fn(),
}));

describe("NewsletterSignup", () => {
  beforeEach(() => {
    mockUseActionState.mockReset();
  });

  describe("idle state", () => {
    beforeEach(() => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);
    });

    it("renders the pitch, email input, and subscribe button", () => {
      render(<NewsletterSignup variant="inline" />);

      expect(
        screen.getByText(/Top 25, ballots and FCS bracket/),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email address")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled();
    });

    it("includes a hidden honeypot input named url", () => {
      const { container } = render(<NewsletterSignup variant="inline" />);

      const honeypot = container.querySelector(
        'input[name="url"]',
      ) as HTMLInputElement;
      expect(honeypot).toBeTruthy();
      expect(honeypot.tabIndex).toBe(-1);
      expect(honeypot.autocomplete).toBe("off");
      expect(honeypot.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("submitting state", () => {
    it("disables the button and shows submitting text", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);
      render(<NewsletterSignup variant="inline" />);

      const button = screen.getByRole("button", { name: /subscribing/i });
      expect(button).toBeDisabled();
    });
  });

  describe("success state", () => {
    it("shows the confirmation message", () => {
      mockUseActionState.mockReturnValue([{ success: true }, vi.fn(), false]);
      render(<NewsletterSignup variant="inline" />);

      expect(
        screen.getByText("Check your inbox to confirm."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows the error message from the action", () => {
      mockUseActionState.mockReturnValue([
        { error: "Please enter a valid email address." },
        vi.fn(),
        false,
      ]);
      render(<NewsletterSignup variant="inline" />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter a valid email address.",
      );
      expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled();
    });
  });

  describe("action wrapper", () => {
    it("delegates to newsletterSubscribe", async () => {
      // Capture the action fn passed to useActionState
      let capturedAction!: (prev: unknown, fd: FormData) => Promise<unknown>;
      mockUseActionState.mockImplementation((fn: typeof capturedAction) => {
        capturedAction = fn;
        return [null, vi.fn(), false];
      });
      render(<NewsletterSignup variant="inline" />);

      const fd = new FormData();
      fd.append("email", "a@b.com");
      vi.mocked(newsletterSubscribe).mockResolvedValueOnce({ success: true });

      const result = await capturedAction(null, fd);
      expect(newsletterSubscribe).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ success: true });
    });
  });

  describe("compact variant", () => {
    it("applies compact styling", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);
      const { container } = render(<NewsletterSignup variant="compact" />);

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("py-4");
      expect(wrapper.className).not.toContain("rounded-lg");
    });

    it("applies compact success styling", () => {
      mockUseActionState.mockReturnValue([{ success: true }, vi.fn(), false]);
      const { container } = render(<NewsletterSignup variant="compact" />);

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("text-ink-foreground/80");
    });
  });
});
