import { render, screen } from "@testing-library/react";

import { AdSlot } from "@/components/ad-slot";
import type { AdvertisementCreative } from "@/lib/advertisement";

vi.mock("@/components/sanity-image", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? ""} />,
}));

const creative: AdvertisementCreative = {
  id: "ad-1",
  sponsorName: "Nike",
  href: "https://nike.example/fcs",
  openInNewTab: false,
  image: { id: "image-abc", alt: "Nike swoosh" },
};

describe("AdSlot", () => {
  it("renders nothing when the slot is unsold", () => {
    const { container } = render(
      <AdSlot placement="home-sidebar" creative={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("labels an external creative as an advertisement and opens it in a new tab", () => {
    render(<AdSlot placement="home-leaderboard" creative={creative} />);

    expect(screen.getByText("Advertisement")).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://nike.example/fcs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "sponsored noopener noreferrer");
    expect(
      screen.getByRole("img", { name: "Nike swoosh" }),
    ).toBeInTheDocument();
  });

  it("keeps an internal creative on the same tab", () => {
    render(
      <AdSlot
        placement="article-sidebar"
        creative={{
          ...creative,
          href: "/college/football/news",
          openInNewTab: false,
        }}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/college/football/news");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("uses the sponsor name when the creative has no alt text", () => {
    render(
      <AdSlot
        placement="home-sidebar"
        creative={{
          ...creative,
          href: "http://sponsor.example",
          image: { id: "image-abc" },
          openInNewTab: true,
        }}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "sponsored noopener noreferrer");
    expect(
      screen.getByRole("img", { name: "Nike advertisement" }),
    ).toBeInTheDocument();
  });

  it("uses noopener for an internal link that opens in a new tab", () => {
    render(
      <AdSlot
        placement="news-sidebar"
        creative={{
          ...creative,
          href: "/legal/privacy",
          openInNewTab: true,
        }}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});
