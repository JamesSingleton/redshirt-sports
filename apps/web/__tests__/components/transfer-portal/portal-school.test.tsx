import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  PortalSchool,
  PortalSchoolLogo,
} from "@/components/transfer-portal/portal-school";
import { portalSchool } from "../../helpers/transfer-portal-fixtures";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ width, height }: { width: number; height: number }) => (
    <img alt="" data-testid="school-logo" width={width} height={height} />
  ),
}));

describe("PortalSchoolLogo", () => {
  it("renders the logo at the default size", () => {
    const { container } = render(
      <PortalSchoolLogo school={portalSchool({ image: { asset: {} } })} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("28px");
    expect(screen.getByTestId("school-logo")).toHaveAttribute("width", "28");
  });

  it("renders an empty box when the school has no image", () => {
    const { container } = render(
      <PortalSchoolLogo school={portalSchool()} size={72} className="hidden" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("hidden");
    expect(wrapper.style.height).toBe("72px");
    expect(screen.queryByTestId("school-logo")).not.toBeInTheDocument();
  });
});

describe("PortalSchool", () => {
  it("shows the default fallback without a school", () => {
    render(<PortalSchool school={null} />);
    expect(screen.getByText("Undecided")).toBeInTheDocument();
  });

  it("shows a custom fallback without a school", () => {
    render(<PortalSchool school={null} fallback="Returning" />);
    expect(screen.getByText("Returning")).toBeInTheDocument();
  });

  it("links to the team page when the school has a slug", () => {
    render(<PortalSchool school={portalSchool()} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/college/teams/montana-state",
    );
    expect(screen.getByText("Montana State")).toBeInTheDocument();
  });

  it("renders plain text when the school has no slug", () => {
    render(
      <PortalSchool school={portalSchool({ slug: null, shortName: null })} />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Montana State University")).toBeInTheDocument();
  });
});
