import { render, screen } from "@testing-library/react";

import {
  socialHandle,
  TeamConnectWidget,
} from "@/components/teams/team-connect-widget";

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

describe("socialHandle", () => {
  it("returns the last path segment with an @ prefix", () => {
    expect(socialHandle("https://x.com/redshirtsports")).toBe(
      "@redshirtsports",
    );
  });

  it("returns the hostname when no path segment exists", () => {
    expect(socialHandle("https://www.example.com/")).toBe("example.com");
  });

  it("returns the original value for invalid URLs", () => {
    expect(socialHandle("not-a-url")).toBe("not-a-url");
  });
});

describe("TeamConnectWidget", () => {
  it("returns null when no social links are available", () => {
    const { container } = render(
      <TeamConnectWidget
        schoolName="Alabama"
        schoolSocialLinks={null}
        globalSocialLinks={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("prefers school social links and renders handles", () => {
    render(
      <TeamConnectWidget
        schoolName="Alabama"
        schoolSocialLinks={{
          twitter: "https://x.com/alabama",
          facebook: null,
          bluesky: null,
          threads: null,
          instagram: "https://instagram.com/alabama",
          youtube: null,
        }}
        globalSocialLinks={{
          twitter: "https://x.com/redshirtsports",
          facebook: null,
          bluesky: null,
          threads: null,
          instagram: null,
          youtube: null,
        }}
      />,
    );

    expect(screen.getByText("Connect With Alabama")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://x.com/alabama");
  });

  it("keeps handles that already include an @ prefix", () => {
    expect(socialHandle("https://x.com/@alabama")).toBe("@alabama");
  });

  it("falls back to global social links", () => {
    render(
      <TeamConnectWidget
        schoolSocialLinks={{}}
        globalSocialLinks={{
          twitter: "https://x.com/redshirtsports",
          facebook: null,
          bluesky: null,
          threads: null,
          instagram: null,
          youtube: null,
        }}
      />,
    );

    expect(screen.getByText("Connect With Us")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /@redshirtsports/i }),
    ).toBeInTheDocument();
  });

  it("returns null when resolved social links have no URLs", () => {
    const { container } = render(
      <TeamConnectWidget
        schoolSocialLinks={{
          twitter: "",
          facebook: "   ",
          bluesky: null,
          threads: null,
          instagram: null,
          youtube: null,
        }}
        globalSocialLinks={{
          twitter: null,
          facebook: null,
          bluesky: null,
          threads: null,
          instagram: null,
          youtube: null,
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
