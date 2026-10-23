import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/contact/contact-form", () => ({
  ContactForm: () => <div data-testid="contact-form" />,
}));

vi.mock("@/components/contact/site-social-buttons", () => ({
  SiteSocialButtons: () => <div data-testid="social-buttons" />,
}));

import { ContactPageContent } from "@/components/contact/contact-page-content";

describe("ContactPageContent", () => {
  it("renders social section when links are provided", () => {
    render(
      <ContactPageContent
        contactEmail="hello@example.com"
        socialLinks={{ twitter: "https://twitter.com/redshirt" }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Follow Redshirt Sports/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("social-buttons")).toBeInTheDocument();
  });

  it("omits social section when links are null", () => {
    render(
      <ContactPageContent
        contactEmail="hello@example.com"
        socialLinks={null}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /Follow Redshirt Sports/i }),
    ).not.toBeInTheDocument();
  });
});
