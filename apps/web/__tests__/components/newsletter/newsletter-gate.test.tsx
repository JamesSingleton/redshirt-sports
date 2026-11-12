import { render, screen } from "@testing-library/react";

import { NewsletterGate } from "@/components/newsletter/newsletter-gate";

const { mockIsNewsletterEnabled, mockUseActionState } = vi.hoisted(() => ({
  mockIsNewsletterEnabled: vi.fn(),
  mockUseActionState: vi.fn(),
}));

vi.mock("@/lib/newsletter", () => ({
  isNewsletterEnabled: mockIsNewsletterEnabled,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useActionState: mockUseActionState };
});

vi.mock("@/actions/newsletter-subscribe", () => ({
  newsletterSubscribe: vi.fn(),
}));

describe("NewsletterGate", () => {
  beforeEach(() => {
    mockIsNewsletterEnabled.mockReset();
    mockUseActionState.mockReset();
  });

  it("renders nothing when the newsletter feature is disabled", () => {
    mockIsNewsletterEnabled.mockReturnValue(false);
    const { container } = render(<NewsletterGate variant="inline" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the signup form when the newsletter feature is enabled", () => {
    mockIsNewsletterEnabled.mockReturnValue(true);
    mockUseActionState.mockReturnValue([null, vi.fn(), false]);
    render(<NewsletterGate variant="inline" />);
    expect(
      screen.getByRole("button", { name: "Subscribe" }),
    ).toBeInTheDocument();
  });
});
