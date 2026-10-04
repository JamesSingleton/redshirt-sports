import { render, screen } from "@testing-library/react";

import {
  PortalStats,
  portalStatTotals,
} from "@/components/transfer-portal/portal-stats";

const counts = {
  ENTERED: 1200,
  COMMITTED: 10,
  SIGNED: 5,
  ENROLLED: 2,
  WITHDRAWN: 3,
};

describe("portalStatTotals", () => {
  it("rolls committed, signed, and enrolled into one total", () => {
    expect(portalStatTotals(counts)).toEqual([
      { label: "In portal", value: 1200 },
      { label: "Committed", value: 17 },
      { label: "Withdrawn", value: 3 },
    ]);
  });
});

describe("PortalStats", () => {
  it("renders formatted totals with a custom class", () => {
    const { container } = render(
      <PortalStats counts={counts} className="max-w-xl" />,
    );
    expect(container.querySelector("dl")).toHaveClass("max-w-xl");
    expect(screen.getByText("In portal").nextElementSibling).toHaveTextContent(
      "1,200",
    );
    expect(screen.getByText("Committed").nextElementSibling).toHaveTextContent(
      "17",
    );
    expect(screen.getByText("Withdrawn").nextElementSibling).toHaveTextContent(
      "3",
    );
  });
});
