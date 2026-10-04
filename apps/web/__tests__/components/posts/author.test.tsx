import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import { Byline } from "@/components/posts/author";

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

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ image }: { image?: { alt?: string } }) => (
    <img alt={image?.alt ?? "author"} />
  ),
}));

type BylineAuthor = ComponentProps<typeof Byline>["authors"][number];

const author = {
  _id: "author-1",
  name: "Jane Doe",
  slug: "jane-doe",
  roles: ["Writer", "Editor"],
  archived: false,
  image: { alt: "Jane Doe headshot" },
} as unknown as BylineAuthor;

describe("Byline", () => {
  it("links active authors to their profile page with roles and image", () => {
    render(<Byline authors={[author]} />);

    expect(screen.getByRole("link", { name: "Jane Doe" })).toHaveAttribute(
      "href",
      "/authors/jane-doe",
    );
    expect(screen.getByText("Writer, Editor")).toBeInTheDocument();
    expect(screen.getByAltText("Jane Doe headshot")).toBeInTheDocument();
  });

  it("renders archived authors without a profile link", () => {
    render(<Byline authors={[{ ...author, archived: true }]} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Jane Doe" }),
    ).not.toBeInTheDocument();
  });

  it("lists every author and omits empty roles", () => {
    render(
      <Byline
        authors={[
          author,
          {
            ...author,
            _id: "author-2",
            name: "John Smith",
            slug: "john-smith",
            roles: [],
          },
        ]}
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "John Smith" })).toHaveAttribute(
      "href",
      "/authors/john-smith",
    );
    expect(screen.getAllByText("Writer, Editor")).toHaveLength(1);
  });
});
