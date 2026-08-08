import { render, screen } from "@testing-library/react";

import PageHeader from "@/components/page-header";

vi.mock("@/components/breadcrumbs", () => ({
  __esModule: true,
  default: ({ breadCrumbPages }: { breadCrumbPages: unknown }) => (
    <nav data-testid="breadcrumbs">{JSON.stringify(breadCrumbPages)}</nav>
  ),
}));

describe("PageHeader", () => {
  it("renders the title only when optional props are omitted", () => {
    render(<PageHeader title="Rankings" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Rankings" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("breadcrumbs")).not.toBeInTheDocument();
  });

  it("renders breadcrumbs and subtitle when provided", () => {
    render(
      <PageHeader
        title="Week 1"
        subtitle={<p>Football rankings</p>}
        breadcrumbs={[{ label: "Home", href: "/" }]}
      />,
    );

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByText("Football rankings")).toBeInTheDocument();
  });
});
