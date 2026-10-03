import { render } from "@testing-library/react";

import Loading from "@/app/loading";

describe("RootLoading", () => {
  it("renders the busy homepage skeleton", () => {
    const { container } = render(<Loading />);

    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThanOrEqual(8);
    expect(
      container.querySelector('[data-slot="skeleton"].aspect-video'),
    ).toBeInTheDocument();
  });
});
