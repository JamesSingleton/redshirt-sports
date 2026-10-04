import { TableBody } from "@redshirt-sports/ui/components/table";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  PortalEntriesTable,
  PortalEntryRow,
} from "@/components/transfer-portal/portal-entries-table";
import {
  portalEntry,
  portalPlayer,
  portalSchool,
} from "../../helpers/transfer-portal-fixtures";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

function renderRows(entries: ReturnType<typeof portalEntry>[]) {
  return render(
    <PortalEntriesTable caption="Portal entries">
      <TableBody>
        {entries.map((entry) => (
          <PortalEntryRow key={entry.id} entry={entry} />
        ))}
      </TableBody>
    </PortalEntriesTable>,
  );
}

describe("PortalEntriesTable", () => {
  it("renders the caption and headers", () => {
    renderRows([]);
    expect(screen.getByRole("table", { name: "Portal entries" })).toBeVisible();
    for (const header of ["Player", "From", "To", "Status", "Updated"]) {
      expect(
        screen.getByRole("columnheader", { name: header }),
      ).toBeInTheDocument();
    }
  });

  it("renders a full player row with an undecided destination", () => {
    renderRows([portalEntry()]);
    const row = screen.getAllByRole("row")[1] as HTMLElement;
    expect(within(row).getByRole("link", { name: "Jane Doe" })).toHaveAttribute(
      "href",
      "/players/jane-doe",
    );
    for (const detail of ["QB", "JR", "6-2", "210"]) {
      expect(within(row).getByText(detail)).toBeInTheDocument();
    }
    expect(within(row).getByText("Undecided")).toBeInTheDocument();
    expect(within(row).getByText("In portal")).toBeInTheDocument();
    const time = within(row).getByText("Jan 5, 2026");
    expect(time).toHaveAttribute("datetime", "2026-01-05T00:00:00.000Z");
  });

  it("omits missing details and labels withdrawals as returning", () => {
    renderRows([
      portalEntry({
        status: "WITHDRAWN",
        player: portalPlayer({
          academicYear: null,
          heightInches: null,
          weightLbs: null,
        }),
      }),
    ]);
    const row = screen.getAllByRole("row")[1] as HTMLElement;
    expect(within(row).getByText("QB").parentElement?.children).toHaveLength(1);
    expect(within(row).getByText("Returning")).toBeInTheDocument();
  });

  it("renders the destination school when committed", () => {
    renderRows([
      portalEntry({
        status: "COMMITTED",
        toSchool: portalSchool({
          id: "school-2",
          shortName: "Idaho",
          slug: "idaho",
        }),
      }),
    ]);
    expect(screen.getByRole("link", { name: "Idaho" })).toHaveAttribute(
      "href",
      "/college/teams/idaho",
    );
  });
});
