import { render } from "@testing-library/react";

import SmallLogo from "@/components/small-logo";

describe("SmallLogo", () => {
  it("renders an svg logo", () => {
    const { container } = render(<SmallLogo data-testid="small-logo" />);

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector('[data-testid="small-logo"]')).toBeInTheDocument();
  });
});
