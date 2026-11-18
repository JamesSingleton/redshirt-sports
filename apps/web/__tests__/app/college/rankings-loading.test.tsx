import { render, screen } from "@testing-library/react";

import Loading from "@/app/college/[sport]/rankings/[division]/[year]/[week]/loading";

describe("Rankings week loading", () => {
  it("announces loading", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });
});
