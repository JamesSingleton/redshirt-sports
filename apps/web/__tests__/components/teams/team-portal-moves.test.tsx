import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import { TeamPortalMoves } from "@/components/teams/team-portal-moves";
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

const idaho = portalSchool({ id: "idaho", shortName: "Idaho", slug: "idaho" });

function column(title: string) {
  return screen.getByRole("heading", { name: new RegExp(`^${title}`) })
    .parentElement as HTMLElement;
}

describe("TeamPortalMoves", () => {
  it("renders nothing without moves", () => {
    const { container } = render(
      <TeamPortalMoves teamName="Montana State" incoming={[]} outgoing={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows incoming origins and an empty outgoing column", () => {
    render(
      <TeamPortalMoves
        teamName="Montana State"
        incoming={[portalEntry({ fromSchool: idaho, status: "COMMITTED" })]}
        outgoing={[]}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Montana State transfer portal" }),
    ).toBeInTheDocument();
    const incoming = column("Incoming");
    expect(within(incoming).getByText("1")).toBeInTheDocument();
    expect(
      within(incoming).getByRole("link", { name: /Jane Doe/ }),
    ).toHaveAttribute("href", "/players/jane-doe");
    expect(within(incoming).getByRole("link", { name: "Idaho" })).toBeVisible();
    expect(within(incoming).getByText("Committed")).toBeInTheDocument();
    expect(within(column("Outgoing")).getByText("None yet.")).toBeVisible();
  });

  it("shows outgoing destinations, fallbacks, and caps each column", () => {
    const outgoing = Array.from({ length: 10 }, (_, index) =>
      portalEntry({
        id: `entry-${index}`,
        player: portalPlayer({ slug: `p-${index}`, firstName: `P${index}` }),
        status: index === 0 ? "WITHDRAWN" : "ENTERED",
      }),
    );
    outgoing[1] = portalEntry({ id: "entry-1", toSchool: idaho });
    render(
      <TeamPortalMoves
        teamName="Montana State"
        incoming={[]}
        outgoing={outgoing}
      />,
    );
    const list = column("Outgoing");
    expect(within(list).getByText("10")).toBeInTheDocument();
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
    expect(within(list).getByText("Returning")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: "Idaho" })).toBeVisible();
    expect(within(list).getAllByText("Undecided")).toHaveLength(6);
    expect(within(column("Incoming")).getByText("None yet.")).toBeVisible();
  });
});
