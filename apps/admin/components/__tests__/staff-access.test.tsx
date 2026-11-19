import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  findPeople: vi.fn(),
  setStaffAccess: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  getBallotYears: vi.fn(),
  getBallotWeeks: vi.fn(),
  getBallotWeek: vi.fn(),
}));

vi.mock("@/actions/staff", () => ({
  findPeople: mocks.findPeople,
  setStaffAccess: mocks.setStaffAccess,
}));
vi.mock("@/actions/ballots", () => ({
  getBallotYears: mocks.getBallotYears,
  getBallotWeeks: mocks.getBallotWeeks,
  getBallotWeek: mocks.getBallotWeek,
}));
vi.mock("@redshirt-sports/ui/components/toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

import { navItemsFor } from "@/components/app-sidebar";
import { BallotAudit, leftOff } from "@/components/ballot-audit";
import { StaffHome } from "@/components/staff-home";
import { StaffManager } from "@/components/staff-manager";

describe("nav", () => {
  it("shows only what someone can open", () => {
    const titles = (areas: Parameters<typeof navItemsFor>[0]) =>
      navItemsFor(areas).map((item) => item.title);
    expect(titles(["portal"])).toEqual(["Home", "Transfer portal"]);
    expect(titles(["ballots"])).toEqual(["Home", "Ballots"]);
    expect(titles(["admin", "portal", "ballots"])).toContain("Staff");
    expect(titles(["admin", "portal", "ballots"])).toHaveLength(11);
  });
});

describe("staff home", () => {
  it("shows a card per area and no ballot counts", () => {
    render(
      <StaffHome
        firstName="Zach"
        areas={["portal", "ballots"]}
        portalPending={3}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Welcome, Zach" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Transfer portal/ }),
    ).toHaveAttribute("href", "/portal");
    expect(screen.getByText("3 players waiting to push")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ballots/ })).toHaveAttribute(
      "href",
      "/ballots",
    );
    expect(screen.queryByText(/ballots? (still )?out/i)).toBeNull();
  });

  it("leaves out areas they don't have", () => {
    render(<StaffHome firstName={null} areas={["portal"]} portalPending={1} />);
    expect(
      screen.getByRole("heading", { name: "Welcome" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 player waiting to push")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ballots/ })).toBeNull();
  });

  it("says nothing about pushes when none are waiting", () => {
    render(
      <StaffHome
        firstName="A"
        areas={["ballots", "portal"]}
        portalPending={0}
      />,
    );
    expect(screen.queryByText(/waiting to push/)).toBeNull();
  });
});

const poll = {
  id: "p1",
  name: "FCS Top 25",
  slug: "fcs",
  sportId: "fb",
  sportSlug: "football",
};
const week = {
  pollName: "FCS Top 25",
  published: false,
  ballotCount: 2,
  assignedCount: 3,
  ballots: [
    {
      userId: "a",
      name: "Ann Lee",
      organization: "SI",
      submittedAt: null,
      entries: [{ rank: 1, schoolId: "mt", name: "Montana" }],
    },
    {
      userId: "b",
      name: "Bo Cole",
      organization: null,
      submittedAt: null,
      entries: [
        { rank: 1, schoolId: "mt", name: "Montana" },
        { rank: 2, schoolId: "msu", name: "Montana State" },
      ],
    },
  ],
  missing: [{ userId: "c", name: "Cy Ray", organization: "KPAX" }],
  consensus: [
    { schoolId: "mt", name: "Montana" },
    { schoolId: "msu", name: "Montana State" },
  ],
};

describe("ballot audit", () => {
  beforeEach(() => {
    mocks.getBallotYears.mockResolvedValue([2026]);
    mocks.getBallotWeeks.mockResolvedValue([
      { weekKey: "2-10", label: "Week 10" },
    ]);
    mocks.getBallotWeek.mockResolvedValue(week);
  });
  afterEach(() => vi.clearAllMocks());

  it("finds consensus teams a ballot leaves off", () => {
    expect(leftOff(week.ballots[0]!.entries, week.consensus)).toEqual([
      { schoolId: "msu", name: "Montana State" },
    ]);
    expect(leftOff(week.ballots[1]!.entries, week.consensus)).toEqual([]);
  });

  it("opens on the newest week with every ballot and who's still out", async () => {
    render(<BallotAudit polls={[poll]} />);
    expect(await screen.findByText("2 of 3 ballots in")).toBeInTheDocument();
    expect(mocks.getBallotWeek).toHaveBeenCalledWith({
      sportSlug: "football",
      division: "fcs",
      year: 2026,
      weekKey: "2-10",
    });
    expect(screen.getByText("Not published yet")).toBeInTheDocument();
    const out = screen.getByRole("region", { name: "Still out (1)" });
    expect(within(out).getByText("Cy Ray · KPAX")).toBeInTheDocument();
    const ann = screen.getByRole("heading", { name: "Ann Lee" }).closest("li")!;
    expect(within(ann).getByText("Montana State")).toBeInTheDocument();
    expect(
      within(ann).getByText(/Leaves off consensus top 25/),
    ).toBeInTheDocument();
    const bo = screen.getByRole("heading", { name: "Bo Cole" }).closest("li")!;
    expect(within(bo).queryByText(/Leaves off/)).toBeNull();
  });

  it("filters ballots by voter name", async () => {
    render(<BallotAudit polls={[poll]} />);
    await screen.findByText("2 of 3 ballots in");
    await userEvent.type(screen.getByLabelText("Find a voter"), "bo");
    expect(screen.queryByRole("heading", { name: "Ann Lee" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Bo Cole" }),
    ).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Find a voter"));
    await userEvent.type(screen.getByLabelText("Find a voter"), "zz");
    expect(screen.getByText("No voter matches that name.")).toBeInTheDocument();
  });

  it("says when nothing is in, and shows errors", async () => {
    mocks.getBallotWeek.mockResolvedValueOnce({
      ...week,
      published: true,
      ballots: [],
      missing: [],
    });
    const { unmount } = render(<BallotAudit polls={[poll]} />);
    expect(await screen.findByText("No ballots in yet.")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    unmount();

    mocks.getBallotWeek.mockRejectedValueOnce(new Error("Poll is inactive"));
    render(<BallotAudit polls={[poll]} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Poll is inactive",
    );
  });

  it("handles no polls", () => {
    render(<BallotAudit polls={[]} />);
    expect(screen.getByText("No active polls right now.")).toBeInTheDocument();
  });
});

const zach = {
  id: "user_zach",
  name: "Zach McKinnell",
  organization: "Sports Illustrated",
  isVoter: true,
  isAdmin: false,
  roles: ["portal" as const],
};
const me = {
  id: "user_me",
  name: "James Singleton",
  organization: null,
  isVoter: false,
  isAdmin: true,
  roles: [],
};

describe("staff manager", () => {
  beforeEach(() => {
    mocks.findPeople.mockResolvedValue([]);
  });
  afterEach(() => vi.clearAllMocks());

  it("shows admin from isAdmin and the roles beside it", () => {
    render(<StaffManager me="user_me" staff={[me, zach]} />);
    expect(
      screen.getByRole("checkbox", { name: "Admin for James Singleton" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Admin for Zach McKinnell" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: "Transfer portal for Zach McKinnell",
      }),
    ).toBeChecked();
  });

  it("saves a role when its box is ticked", async () => {
    mocks.setStaffAccess.mockResolvedValue({
      isAdmin: false,
      roles: ["portal", "ballots"],
    });
    render(<StaffManager me="user_me" staff={[me, zach]} />);
    const box = screen.getByRole("checkbox", {
      name: "Ballot viewer for Zach McKinnell",
    });
    await userEvent.click(box);
    await waitFor(() =>
      expect(mocks.setStaffAccess).toHaveBeenCalledWith({
        userId: "user_zach",
        isAdmin: false,
        roles: ["portal", "ballots"],
      }),
    );
    await waitFor(() => expect(box).toBeChecked());
    expect(mocks.success).toHaveBeenCalledWith("Saved Zach McKinnell");
  });

  it("makes someone an admin through isAdmin, keeping their roles", async () => {
    mocks.setStaffAccess.mockResolvedValue({
      isAdmin: true,
      roles: ["portal"],
    });
    render(<StaffManager me="user_me" staff={[me, zach]} />);
    const box = screen.getByRole("checkbox", {
      name: "Admin for Zach McKinnell",
    });
    await userEvent.click(box);
    await waitFor(() =>
      expect(mocks.setStaffAccess).toHaveBeenCalledWith({
        userId: "user_zach",
        isAdmin: true,
        roles: ["portal"],
      }),
    );
    await waitFor(() => expect(box).toBeChecked());
  });

  it("unticks, reports failures, and locks your own admin box", async () => {
    mocks.setStaffAccess.mockRejectedValueOnce(new Error("Clerk is down"));
    render(<StaffManager me="user_me" staff={[me, zach]} />);
    expect(
      screen.getByRole("checkbox", { name: "Admin for James Singleton" }),
    ).toBeDisabled();
    expect(screen.getByText("(you)")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Transfer portal for Zach McKinnell",
      }),
    );
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Clerk is down"),
    );
    expect(mocks.setStaffAccess).toHaveBeenCalledWith({
      userId: "user_zach",
      isAdmin: false,
      roles: [],
    });
  });

  it("finds someone by name and adds them to the table", async () => {
    mocks.findPeople.mockResolvedValue([
      {
        ...zach,
        id: "user_new",
        name: "New Person",
        roles: [],
        organization: null,
      },
      zach,
    ]);
    render(<StaffManager me="user_me" staff={[me, zach]} />);
    await userEvent.type(
      screen.getByLabelText("Find an account by name"),
      "ne",
    );
    const add = await screen.findByRole("button", { name: "Add" });
    expect(screen.getByRole("button", { name: "Listed" })).toBeDisabled();
    await userEvent.click(add);
    expect(
      screen.getByRole("checkbox", { name: "Admin for New Person" }),
    ).not.toBeChecked();
  });

  it("shows a generic message when saving fails without one", async () => {
    mocks.setStaffAccess.mockRejectedValueOnce("nope");
    mocks.findPeople.mockRejectedValue(new Error("x"));
    render(<StaffManager me="user_me" staff={[zach]} />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Admin for Zach McKinnell" }),
    );
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Couldn't save"),
    );
  });
});
