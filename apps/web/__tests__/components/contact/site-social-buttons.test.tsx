import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { SiteSocialButtons } from "@/components/contact/site-social-buttons";

describe("SiteSocialButtons", () => {
  it("returns null when there are no links", () => {
    const { container } = render(
      <SiteSocialButtons socialLinks={{ twitter: "", facebook: null }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders network links with hints", () => {
    render(
      <SiteSocialButtons
        socialLinks={{
          twitter: "https://twitter.com/redshirt",
          instagram: "https://www.instagram.com/redshirt",
          threads: "https://www.threads.net/@redshirt",
          youtube: "https://www.youtube.com/@redshirt",
          bluesky: "https://bsky.app/profile/redshirt.bsky.social",
          facebook: "not-a-valid-url",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /X/i })).toHaveAttribute(
      "href",
      "https://twitter.com/redshirt",
    );
    expect(screen.getByText("@redshirt")).toBeInTheDocument();
    expect(screen.getByText("bsky.app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Facebook/i })).toHaveAttribute(
      "href",
      "not-a-valid-url",
    );
  });
});
