import { render, screen } from "@testing-library/react";

import NotFound from "@/app/not-found";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("NotFound", () => {
  it("renders a 404 message and link back home", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
