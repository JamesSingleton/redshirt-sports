import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/sanity-image", () => ({
  default: ({ image }: { image: { id: string } }) => (
    <img alt={`logo ${image.id}`} />
  ),
}));

import {
  type DirectorySport,
  type DirectoryTeam,
  TeamsDirectory,
} from "@/components/teams/teams-directory";

const mvfc = {
  _id: "mvfc",
  name: "Missouri Valley Football",
  shortName: "MVFC",
};
const caa = {
  _id: "caa",
  name: "Coastal Athletic Association",
  shortName: null,
};
const summit = { _id: "summit", name: null, shortName: null };

function team(
  overrides: { _id: string; name: string } & Record<string, unknown>,
): DirectoryTeam {
  return {
    shortName: null,
    nickname: null,
    slug: overrides._id,
    image: null,
    affiliations: null,
    ...overrides,
  } as unknown as DirectoryTeam;
}

const teams: DirectoryTeam[] = [
  team({
    _id: "ndsu",
    name: "North Dakota State University",
    shortName: "North Dakota State",
    nickname: "Bison",
    image: { id: "ndsu" },
    affiliations: [
      { sport: "football", conference: mvfc },
      { sport: "mens-basketball", conference: summit },
    ],
  }),
  team({
    _id: "sdsu",
    name: "South Dakota State",
    nickname: "Jackrabbits",
    affiliations: [{ sport: "football", conference: mvfc }],
  }),
  team({
    _id: "villanova",
    name: "Villanova",
    affiliations: [{ sport: "football", conference: caa }],
  }),
  team({ _id: "unaffiliated", name: "Unaffiliated" }),
];

const sports: DirectorySport[] = [
  { slug: "football", title: "Football" },
  { slug: "mens-basketball", title: "Men's Basketball" },
];

function headings() {
  return screen
    .queryAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

describe("TeamsDirectory", () => {
  it("groups the first sport's teams by conference", () => {
    render(<TeamsDirectory teams={teams} sports={sports} />);

    expect(headings()).toEqual(["Coastal Athletic Association", "MVFC"]);
    const mvfcSection = screen.getByRole("region", { name: "MVFC" });
    const ndsu = within(mvfcSection).getByRole("link", {
      name: /North Dakota State/,
    });
    expect(ndsu).toHaveAttribute("href", "/college/teams/ndsu");
    expect(within(ndsu).getByAltText("logo ndsu")).toBeInTheDocument();
    expect(ndsu).toHaveTextContent("Bison");
    expect(
      within(mvfcSection).getByRole("link", { name: /South Dakota State/ }),
    ).toHaveTextContent("Jackrabbits");
    expect(screen.queryByText("Unaffiliated")).not.toBeInTheDocument();
  });

  it("searches team names and nicknames", async () => {
    const user = userEvent.setup();
    render(<TeamsDirectory teams={teams} sports={sports} />);

    await user.type(screen.getByRole("searchbox"), "jackrabbits");

    expect(headings()).toEqual(["MVFC"]);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("filters to one conference from the conference combobox", async () => {
    const user = userEvent.setup();
    render(<TeamsDirectory teams={teams} sports={sports} />);

    await user.click(
      screen.getByRole("combobox", { name: "Conference: All conferences" }),
    );
    await user.type(
      await screen.findByPlaceholderText("Search conferences"),
      "coastal",
    );
    await user.click(
      screen.getByRole("option", { name: "Coastal Athletic Association" }),
    );

    expect(headings()).toEqual(["Coastal Athletic Association"]);
  });

  it("switches sports and resets the conference filter", async () => {
    const user = userEvent.setup();
    render(<TeamsDirectory teams={teams} sports={sports} />);

    await user.click(screen.getByRole("combobox", { name: /Conference/ }));
    await user.click(await screen.findByRole("option", { name: "MVFC" }));
    expect(headings()).toEqual(["MVFC"]);

    await user.click(screen.getByRole("button", { name: "Men's Basketball" }));

    expect(headings()).toEqual(["Other"]);
    expect(
      screen.getByRole("combobox", { name: "Conference: All conferences" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Men's Basketball" }));
    expect(headings()).toEqual(["Other"]);
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TeamsDirectory teams={teams} sports={sports} />);

    await user.type(screen.getByRole("searchbox"), "nobody");

    expect(screen.getByText("No teams found")).toBeInTheDocument();
  });

  it("renders the empty state when there are no sports", () => {
    render(<TeamsDirectory teams={[]} sports={[]} />);

    expect(screen.getByText("No teams found")).toBeInTheDocument();
  });
});
