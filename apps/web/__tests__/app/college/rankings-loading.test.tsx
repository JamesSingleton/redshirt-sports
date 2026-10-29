import { render, screen } from "@testing-library/react";

import Loading from "@/app/college/[sport]/rankings/[division]/[year]/[week]/loading";

describe("Rankings week loading", () => {
  it("renders the poll tab skeleton under the week header", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(document.querySelector("[data-slot=skeleton]")).toHaveClass("h-64");
  });
});
