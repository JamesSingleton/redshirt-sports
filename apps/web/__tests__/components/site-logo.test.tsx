import { render, screen } from "@testing-library/react";

import { SiteLogo } from "@/components/site-logo";

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({
    image,
    className,
    priority,
  }: {
    image: { alt: string };
    className?: string;
    priority?: boolean;
  }) => (
    <img
      alt={image.alt}
      className={className}
      data-priority={String(priority)}
    />
  ),
}));

const light = { alt: "Light logo" } as never;
const dark = { alt: "Dark logo" } as never;

describe("SiteLogo", () => {
  it("renders the brand name when no logos are configured", () => {
    render(<SiteLogo />);
    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders separate light and dark logos", () => {
    render(<SiteLogo light={light} dark={dark} priority className="h-8" />);

    expect(screen.getByRole("img", { name: "Light logo" })).toHaveClass(
      "dark:hidden",
      "h-8",
    );
    expect(screen.getByRole("img", { name: "Dark logo" })).toHaveClass(
      "dark:block",
      "h-8",
    );
    expect(screen.getByRole("img", { name: "Light logo" })).toHaveAttribute(
      "data-priority",
      "true",
    );
  });

  it("uses the dark logo for both modes when only dark is set", () => {
    render(<SiteLogo dark={dark} />);
    expect(screen.getAllByRole("img", { name: "Dark logo" })).toHaveLength(2);
  });

  it("uses the light logo for both modes when only light is set", () => {
    render(<SiteLogo light={light} />);
    expect(screen.getAllByRole("img", { name: "Light logo" })).toHaveLength(2);
  });

  it("skips a mode whose logo is an empty URL string", () => {
    const { rerender } = render(<SiteLogo light="" dark={dark} />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Dark logo" })).toHaveClass(
      "dark:block",
    );

    rerender(<SiteLogo light={light} dark="" />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Light logo" })).toHaveClass(
      "dark:hidden",
    );
  });
});
