import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";

import { OurTeamCard } from "@/components/our-team-card";

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="avatar" />,
}));

type Author = ComponentProps<typeof OurTeamCard>["authors"][number];

function author(overrides: Partial<Author>): Author {
  return {
    _id: "author",
    name: "Author",
    slug: "author",
    roles: [],
    image: null,
    socialLinks: null,
    ...overrides,
  } as Author;
}

describe("OurTeamCard", () => {
  it("renders nothing without authors", () => {
    const { container } = render(<OurTeamCard authors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists authors with roles and their configured social links", () => {
    render(
      <OurTeamCard
        authors={[
          author({
            _id: "jane",
            name: "Jane Writer",
            slug: "jane-writer",
            roles: ["Editor", "Writer"],
            socialLinks: {
              twitter: "https://x.com/jane",
              instagram: "https://instagram.com/jane",
            } as never,
          }),
          author({ _id: "sam", name: "Sam Plain", slug: "sam-plain" }),
        ]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Our team" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About us" })).toHaveAttribute(
      "href",
      "/about",
    );

    const [jane, sam] = screen.getAllByRole("listitem");
    expect(
      within(jane!).getByRole("link", { name: "Jane Writer" }),
    ).toHaveAttribute("href", "/authors/jane-writer");
    expect(within(jane!).getByText("Editor, Writer")).toBeInTheDocument();
    expect(
      within(jane!).getByRole("link", { name: "Jane Writer on X" }),
    ).toHaveAttribute("href", "https://x.com/jane");
    expect(
      within(jane!).getByRole("link", { name: "Jane Writer on Instagram" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      within(jane!).queryByRole("link", { name: "Jane Writer on YouTube" }),
    ).not.toBeInTheDocument();

    expect(within(sam!).getAllByRole("link")).toHaveLength(1);
    expect(within(sam!).queryByText(/,/)).not.toBeInTheDocument();
  });
});
