import { badgeVariants } from "@redshirt-sports/ui/components/badge";
import { render, screen } from "@testing-library/react";

import { PortalStatusBadge } from "@/components/transfer-portal/portal-status-badge";

describe("PortalStatusBadge", () => {
  it.each([
    ["ENTERED", "In portal", "outline"],
    ["COMMITTED", "Committed", "default"],
    ["SIGNED", "Signed", "default"],
    ["ENROLLED", "Enrolled", "secondary"],
    ["WITHDRAWN", "Withdrawn", "secondary"],
  ] as const)("renders %s as %s", (status, label, variant) => {
    render(<PortalStatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveAttribute(
      "class",
      badgeVariants({ variant }),
    );
  });
});
