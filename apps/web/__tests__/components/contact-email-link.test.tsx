import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContactEmailLink } from "@/components/contact-email-link";

const mockCapture = vi.fn();

vi.mock("posthog-js", () => ({
  default: { capture: (...args: unknown[]) => mockCapture(...args) },
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("ContactEmailLink", () => {
  beforeEach(() => {
    mockCapture.mockClear();
  });

  it("renders a mailto link with the email address", () => {
    render(<ContactEmailLink email="hello@example.com" category="general" />);

    const link = screen.getByRole("link", { name: "hello@example.com" });
    expect(link).toHaveAttribute("href", "mailto:hello@example.com");
  });

  it("captures a PostHog event when clicked", async () => {
    const user = userEvent.setup();
    render(<ContactEmailLink email="hello@example.com" category="press" />);

    await user.click(screen.getByRole("link", { name: "hello@example.com" }));

    expect(mockCapture).toHaveBeenCalledWith("contact_email_clicked", {
      email_category: "press",
      email_address: "hello@example.com",
    });
  });
});
