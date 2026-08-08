import { render, screen } from "@testing-library/react";

import { TeamPageLink } from "@/components/rankings/team-page-link";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("TeamPageLink", () => {
  it("renders children without a link when slug is missing", () => {
    render(<TeamPageLink slug={null}>Alabama</TeamPageLink>);

    expect(screen.getByText("Alabama")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("wraps children in a team page link when slug is provided", () => {
    render(
      <TeamPageLink slug="alabama" className="custom-link">
        Alabama
      </TeamPageLink>,
    );

    const link = screen.getByRole("link", { name: "Alabama" });
    expect(link).toHaveAttribute("href", "/college/teams/alabama");
    expect(link).toHaveClass("custom-link");
  });

  it("uses the default hover class when className is omitted", () => {
    render(<TeamPageLink slug="georgia">Georgia</TeamPageLink>);

    expect(screen.getByRole("link", { name: "Georgia" })).toHaveClass(
      "hover:underline",
    );
  });
});
