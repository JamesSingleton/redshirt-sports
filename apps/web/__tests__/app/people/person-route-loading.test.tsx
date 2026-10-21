import { render, screen } from "@testing-library/react";

import PersonRouteLoading from "@/app/people/[slug]/loading";

describe("PersonRouteLoading", () => {
  it("renders an accessible loading state", () => {
    render(<PersonRouteLoading />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading profile/i);
  });
});
