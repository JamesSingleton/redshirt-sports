import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

import {
  conferenceOf,
  EligibleTeams,
} from "@/components/ballot/eligible-teams";

const schools = [
  {
    _id: "msu",
    name: "Montana State University",
    shortName: "Montana State",
    abbreviation: "MSU",
    image: { id: "logo" },
    conferenceInfo: {
      conference: { name: "Big Sky Conference", shortName: "Big Sky" },
    },
  },
  {
    _id: "um",
    name: "University of Montana",
    shortName: "Montana",
    abbreviation: "UM",
    image: null,
    conferenceInfo: {
      conference: { name: "Big Sky Conference", shortName: "Big Sky" },
    },
  },
  {
    _id: "ndsu",
    name: "North Dakota State University",
    shortName: null,
    abbreviation: null,
    image: null,
    conferenceInfo: { conference: { name: "MVFC", shortName: null } },
  },
  {
    _id: "ind",
    name: "Independent U",
    shortName: "Indy",
    abbreviation: "IND",
    image: null,
    conferenceInfo: { conference: null },
  },
] as never;

function teamNames() {
  return within(screen.getByRole("list", { name: "Eligible teams" }))
    .getAllByRole("listitem")
    .map((item) => item.querySelector(".font-medium")?.textContent);
}

describe("EligibleTeams", () => {
  it("adds a team that isn't on the ballot, and marks the ones that are", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <EligibleTeams
        schools={schools}
        ballot={["msu", ""]}
        lastWeek={new Map([["um", 7]])}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByText("On ballot · #1")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add Montana State" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Big Sky · your #7 last week")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Add Montana" }));
    expect(onAdd).toHaveBeenCalledWith("um");
  });

  it("searches and filters by conference", async () => {
    const user = userEvent.setup();
    render(
      <EligibleTeams
        schools={schools}
        ballot={[""]}
        lastWeek={new Map()}
        onAdd={vi.fn()}
      />,
    );

    const conferences = screen.getByRole("group", { name: "Conference" });
    expect(
      within(conferences)
        .getAllByRole("button")
        .map((chip) => chip.textContent),
    ).toEqual(["All", "Big Sky", "MVFC"]);

    await user.click(within(conferences).getByRole("button", { name: "MVFC" }));
    expect(teamNames()).toEqual(["North Dakota State University"]);
    expect(
      within(conferences).getByRole("button", { name: "MVFC" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(within(conferences).getByRole("button", { name: "All" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search teams" }),
      "msu",
    );
    expect(teamNames()).toEqual(["Montana State"]);

    await user.clear(screen.getByRole("searchbox", { name: "Search teams" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search teams" }),
      "zzz",
    );
    expect(screen.getByText("No team found.")).toBeVisible();
  });

  it("won't add to a full ballot", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <EligibleTeams
        schools={schools}
        ballot={["msu"]}
        lastWeek={new Map()}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByText(/Your ballot is full/)).toBeVisible();
    const add = screen.getByRole("button", { name: "Add Montana" });
    expect(add).toHaveAttribute("aria-disabled", "true");
    await user.click(add);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows the biggest conferences, and the rest behind More", async () => {
    const user = userEvent.setup();
    const many = ["A", "B", "B", "C", "D", "E", "F"].map((conf, index) => ({
      _id: `s${index}`,
      name: `School ${index}`,
      shortName: null,
      abbreviation: null,
      image: null,
      conferenceInfo: { conference: { name: conf, shortName: null } },
    })) as never;
    render(
      <EligibleTeams
        schools={many}
        ballot={[""]}
        lastWeek={new Map()}
        onAdd={vi.fn()}
      />,
    );
    const group = screen.getByRole("group", { name: "Conference" });
    const chips = () =>
      within(group)
        .getAllByRole("button")
        .map((chip) => chip.textContent);
    expect(chips()).toEqual(["All", "B", "A", "C", "D", "More"]);

    await user.click(within(group).getByRole("button", { name: "More" }));
    expect(chips()).toEqual(["All", "B", "A", "C", "D", "E", "F", "Fewer"]);

    await user.click(within(group).getByRole("button", { name: "F" }));
    await user.click(within(group).getByRole("button", { name: "Fewer" }));
    expect(chips()).toEqual(["All", "B", "A", "C", "D", "F", "More"]);
    expect(teamNames()).toEqual(["School 6"]);
  });

  it("hides the conference chips when there's only one conference", () => {
    render(
      <EligibleTeams
        schools={[(schools as never[])[0]] as never}
        ballot={[""]}
        lastWeek={new Map()}
        onAdd={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("group", { name: "Conference" }),
    ).not.toBeInTheDocument();
  });

  it("names a conference by its short name, else its full name", () => {
    const [msu, , ndsu, ind] = schools as unknown as Parameters<
      typeof conferenceOf
    >[0][];
    expect(conferenceOf(msu!)).toBe("Big Sky");
    expect(conferenceOf(ndsu!)).toBe("MVFC");
    expect(conferenceOf(ind!)).toBeUndefined();
    expect(conferenceOf({ conferenceInfo: null } as never)).toBeUndefined();
  });
});
