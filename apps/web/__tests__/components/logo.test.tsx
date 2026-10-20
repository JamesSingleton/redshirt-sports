import { render, screen } from "@testing-library/react";

import { Logo } from "@/components/logo";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    priority,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
  }) => <img src={src} alt={alt} data-priority={String(priority ?? false)} />,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({
    image,
    priority,
  }: {
    image?: { alt?: string };
    priority?: boolean;
  }) => (
    <img
      alt={image?.alt ?? "sanity-logo"}
      data-testid="sanity-logo"
      data-priority={String(priority ?? false)}
    />
  ),
}));

describe("Logo", () => {
  it("renders a Sanity image when image is provided", () => {
    render(
      <Logo
        image={{ alt: "Site logo", asset: { _ref: "image-1" } } as never}
        alt="Site logo"
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("sanity-logo")).toHaveAttribute(
      "data-priority",
      "true",
    );
  });

  it("renders a fallback Next image when src is provided", () => {
    render(<Logo src="https://example.com/logo.svg" alt="Fallback logo" />);

    expect(screen.getByRole("img", { name: "Fallback logo" })).toHaveAttribute(
      "src",
      "https://example.com/logo.svg",
    );
  });

  it("renders the display wordmark when src and image are omitted", () => {
    render(<Logo alt={null} />);

    expect(
      screen.getByRole("link", { name: "Redshirt Sports home" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("Redshirt")).toBeInTheDocument();
    expect(screen.getByText("Sports")).toBeInTheDocument();
  });
});
