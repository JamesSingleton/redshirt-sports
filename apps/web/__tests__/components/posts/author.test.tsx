import { render, screen } from "@testing-library/react";

import {
  AuthorItem,
  AuthorSection,
  MobileAuthorSection,
} from "@/components/posts/author";

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

const author = {
  _id: "author-1",
  name: "Jane Doe",
  slug: "jane-doe",
  roles: ["Writer", "Editor"],
  archived: false,
  image: { alt: "Jane Doe" },
};

describe("Author components", () => {
  it("links active authors to their profile page", () => {
    render(<AuthorItem {...(author as never)} />);

    expect(screen.getByRole("link", { name: "Jane Doe" })).toHaveAttribute(
      "href",
      "/authors/jane-doe",
    );
    expect(screen.getByText("Writer, Editor")).toBeInTheDocument();
  });

  it("renders archived authors without a profile link", () => {
    render(<AuthorItem {...({ ...author, archived: true } as never)} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Jane Doe" }),
    ).not.toBeInTheDocument();
  });

  it("renders the author section list", () => {
    render(<AuthorSection authors={[author as never]} />);

    expect(screen.getByText("Written By")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the mobile author section", () => {
    render(<MobileAuthorSection authors={[author as never]} />);

    expect(screen.getByText("Written By")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
