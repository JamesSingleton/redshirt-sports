import { render, screen } from "@testing-library/react";

import { SchoolMark } from "@/components/portal/marks";

vi.mock("@/components/rankings/team-mark", () => ({
  TeamMark: (props: { shortName: string; name: string }) => (
    <span
      data-testid="logo"
      data-short={props.shortName}
      data-name={props.name}
    />
  ),
}));

describe("SchoolMark", () => {
  it("draws the logo, naming it by whatever the school row has", () => {
    render(
      <SchoolMark
        view={{
          key: "x",
          name: "Montana",
          school: {
            name: null,
            shortName: null,
            abbreviation: null,
            slug: null,
            image: { asset: { _ref: "image-a" } },
          },
        }}
        ring
      />,
    );
    expect(screen.getByTestId("logo")).toHaveAttribute("data-short", "Montana");
    expect(screen.getByTestId("logo")).toHaveAttribute("data-name", "Montana");
  });

  it("draws initials for a school without a logo", () => {
    const { container, rerender } = render(
      <SchoolMark
        view={{
          key: "x",
          name: "Montana",
          school: {
            name: "University of Montana",
            shortName: "Montana",
            abbreviation: "um",
            slug: "montana",
            image: null,
          },
        }}
        faded
      />,
    );
    expect(container).toHaveTextContent("UM");
    rerender(
      <SchoolMark
        view={{ key: "name:Carroll", name: "Carroll College", school: null }}
      />,
    );
    expect(container).toHaveTextContent("CARR");
    rerender(<SchoolMark view={null} />);
    expect(screen.getByTitle("Undecided")).toHaveTextContent("?");
  });
});
