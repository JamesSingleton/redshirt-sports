import { render, screen } from "@testing-library/react";

import FormatDate from "@/components/format-date";

describe("FormatDate", () => {
  it("renders a time element with a Phoenix timezone formatted date", () => {
    render(<FormatDate dateString="2026-01-15T20:00:00.000Z" />);

    const time = screen.getByRole("time");
    expect(time).toHaveAttribute("datetime", "2026-01-15T20:00:00.000Z");
    expect(time).toHaveTextContent("Jan 15, 2026");
  });

  it("applies a custom className", () => {
    render(
      <FormatDate dateString="2026-01-15T20:00:00.000Z" className="text-sm" />,
    );

    expect(screen.getByRole("time")).toHaveClass("text-sm");
  });
});
