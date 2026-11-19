import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  EMPTY_FILTERS,
  filterWirePlayers,
  wireCounts,
} from "@/components/portal/wire-format";
import { WireView } from "@/components/portal/wire-view";
import { wireData, wireRow } from "../../helpers/portal-wire";

const scope = {
  sport: "football",
  sports: [{ slug: "football", label: "Football" }],
  year: 2026,
  years: [2026],
  currentYear: 2026,
};

/** `count` players, one entered row each, newest first. */
const many = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    wireRow({
      eventId: 1000 + count - index,
      recruitmentId: 1000 + count - index,
      lastName: `Player${1000 + count - index}`,
    }),
  );

function mockFetch(response: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Render the view the way the page does: the first players, the cycle's counts. */
function renderWire(
  initial: ReturnType<typeof wireData>,
  full = initial,
  sport = "football",
) {
  const players = filterWirePlayers(full, EMPTY_FILTERS);
  return render(
    <WireView
      initial={initial}
      initialCounts={wireCounts(players)}
      totalPlayers={players.length}
      jsonUrl="/api/x"
      scope={{ ...scope, sport }}
    />,
  );
}

const rows = () =>
  screen
    .queryAllByRole("listitem")
    .filter((item) => item.querySelector("img[src$='player-avatar.svg']"));

async function pick(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string | RegExp,
) {
  // Sort exists twice (desktop row and phone row); the first will do.
  await user.click(screen.getAllByRole("combobox", { name: label })[0]!);
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("WireView", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/college/football/transfer-portal");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the scoreboard and a row per player", async () => {
    const data = wireData([
      wireRow({
        eventId: 4,
        recruitmentId: 1,
        type: "committed",
        status: "committed",
        schoolId: "boise",
        destination: { schoolId: "boise" },
        position: "QB",
        classAtEntry: "RS-SO",
        heightIn: 74,
        weightLb: 205,
        isGradTransfer: true,
        highSchoolName: "Sentinel",
        hometownCity: "Missoula",
        hometownState: "MT",
      }),
      wireRow({ eventId: 3, recruitmentId: 1, status: "committed" }),
      wireRow({
        eventId: 2,
        recruitmentId: 2,
        lastName: "Hill",
        type: "withdrew",
        status: "withdrawn",
        origin: { schoolName: "Carroll College" },
      }),
      wireRow({ eventId: 1, recruitmentId: 3, lastName: "Still" }),
    ]);
    const fetchMock = mockFetch(data);
    renderWire(data);

    const board = within(screen.getByRole("region", { name: /so far/ }));
    const tally = (label: string) =>
      board.getByText(label).closest("div")!.querySelector("dd");
    expect(tally("Entered")).toHaveTextContent("3");
    expect(tally("Committed")).toHaveTextContent("133%");
    expect(tally("Still in portal")).toHaveTextContent("133%");
    expect(tally("Withdrawn")).toHaveTextContent("133%");

    expect(screen.getByText("Showing 1–3 of 3")).toBeInTheDocument();

    const [committed, withdrew, still] = rows();
    expect(within(committed!).getByText("Jalen Brooks")).toBeInTheDocument();
    expect(
      within(committed!).getByText("Sentinel (Missoula, MT)"),
    ).toBeInTheDocument();
    expect(within(committed!).getByText(`6'2" / 205`)).toBeInTheDocument();
    expect(within(committed!).getByText("R-So")).toBeInTheDocument();
    expect(within(committed!).queryByText(/yrs? left/)).toBeNull();
    expect(within(committed!).getByText("Committed")).toBeInTheDocument();
    // Grad transfers get a cap after the name, explained on hover and focus.
    const cap = within(committed!).getByRole("img", {
      name: "Grad transfer: earned a degree before transferring",
    });
    await userEvent.setup().hover(cap);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Grad transfer: earned a degree before transferring",
    );
    expect(
      within(withdrew!).queryByRole("img", { name: /Grad transfer/ }),
    ).toBeNull();
    // The legend explains the cap, the faded tile, and the question mark.
    const legend = within(screen.getByRole("list", { name: "Legend" }));
    expect(legend.getByText("Grad transfer")).toBeInTheDocument();
    expect(legend.getByText("Undecided")).toBeInTheDocument();
    expect(
      within(committed!).getByRole("img", {
        name: "School path: Montana → Boise State University",
      }),
    ).toBeInTheDocument();

    expect(
      within(withdrew!).getByRole("img", {
        name: "School path: returning to Carroll College",
      }),
    ).toBeInTheDocument();
    expect(within(withdrew!).getByText("Returning")).toBeInTheDocument();

    expect(within(still!).getByTitle("Undecided")).toHaveTextContent("?");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads every player when someone filters, and counts follow the filters", async () => {
    const initial = wireData(many(50));
    const full = wireData([
      ...many(50),
      wireRow({
        eventId: 1,
        recruitmentId: 1,
        lastName: "Hill",
        position: "WR",
        type: "committed",
        status: "committed",
      }),
    ]);
    const fetchMock = mockFetch(full);
    const user = userEvent.setup();
    renderWire(initial, full);
    expect(screen.getByText("Showing 1–25 of 51")).toBeInTheDocument();

    await pick(user, "Positions", "WR");
    await waitFor(() =>
      expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/x");
    expect(window.location.search).toBe("?pos=WR");
    expect(
      screen.getByRole("button", { name: "Remove filter: WR" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: /so far/ }))
        .getByText("Entered")
        .closest("div")!
        .querySelector("dd"),
    ).toHaveTextContent("1");

    // Status is a dropdown with counts.
    await user.click(screen.getByRole("combobox", { name: "Statuses" }));
    expect(
      screen.getByRole("option", { name: "Committed · 1" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Entered · 0" }));
    expect(
      screen.getByText("No players match these filters."),
    ).toBeInTheDocument();
    expect(window.location.search).toBe("?status=entered&pos=WR");
    await user.click(
      screen.getByRole("button", { name: "Remove filter: Entered" }),
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(window.location.search).toBe("");
    expect(screen.getByText("Showing 1–25 of 51")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("pages, sorts, and keeps both in the URL", async () => {
    mockFetch(wireData(many(60)));
    const user = userEvent.setup();
    renderWire(wireData(many(50)), wireData(many(60)));
    expect(rows()).toHaveLength(25);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(screen.getByText("Showing 26–50 of 60")).toBeInTheDocument(),
    );
    expect(window.location.search).toBe("?page=2");
    await user.click(screen.getByRole("button", { name: "3" }));
    expect(screen.getByText("Showing 51–60 of 60")).toBeInTheDocument();
    expect(rows()).toHaveLength(10);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // A new sort starts over at page 1.
    await pick(user, "Sort", "Name");
    expect(window.location.search).toBe("?sort=name");
    expect(
      within(rows()[0]!).getByText("Jalen Player1001"),
    ).toBeInTheDocument();
  });

  it("narrows schools by division, and filters by class and grad transfer", async () => {
    const data = wireData([
      wireRow({
        eventId: 3,
        recruitmentId: 1,
        type: "committed",
        status: "committed",
        schoolId: "boise",
        destination: { schoolId: "boise", subdivisionId: "fbs" },
        classAtEntry: "SO",
        isGradTransfer: true,
      }),
      wireRow({
        eventId: 2,
        recruitmentId: 2,
        lastName: "Hill",
        origin: { schoolName: "Carroll College", divisionId: "naia" },
      }),
    ]);
    mockFetch(data);
    const user = userEvent.setup();
    renderWire(data);

    await pick(user, "Divisions", "NAIA");
    expect(rows()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "School" }));
    const list = await screen.findByRole("listbox");
    await user.click(
      within(list).getByRole("option", { name: /Carroll College/ }),
    );
    expect(window.location.search).toBe(
      "?division=naia&school=name%3ACarroll+College",
    );
    expect(
      screen.getByRole("button", { name: "Remove filter: Carroll College" }),
    ).toBeInTheDocument();
    // Removing the division also clears a school picked under it.
    await user.click(
      screen.getByRole("button", { name: "Remove filter: NAIA" }),
    );
    expect(window.location.search).toBe("");

    await pick(user, "Classes", "SO");
    await user.click(screen.getAllByLabelText("Grad transfers")[0]!);
    expect(rows()).toHaveLength(1);
    expect(window.location.search).toBe("?class=SO&grad=1");
    await user.click(screen.getByRole("button", { name: "Remove filter: SO" }));
    await user.click(
      screen.getByRole("button", { name: "Remove filter: Grad transfers" }),
    );
    expect(rows()).toHaveLength(2);
  });

  it("searches players and schools", async () => {
    const data = wireData([
      wireRow({ eventId: 2, recruitmentId: 2, lastName: "Hill" }),
      wireRow({ eventId: 1, recruitmentId: 1 }),
    ]);
    mockFetch(data);
    const user = userEvent.setup();
    renderWire(data);
    await user.type(screen.getByLabelText("Search player or school"), "hill");
    expect(rows()).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Remove filter: “hill”" }),
    ).toBeInTheDocument();
  });

  it("keeps the newest players when the rest won't load", async () => {
    mockFetch({}, false);
    const user = userEvent.setup();
    renderWire(wireData(many(50)), wireData(many(60)));
    await user.click(screen.getByLabelText("Search player or school"));
    await waitFor(() =>
      expect(
        screen.getByText("Couldn't load every player. Showing the newest."),
      ).toBeInTheDocument(),
    );
    expect(rows()).toHaveLength(25);
  });

  it("applies a shared link's filters without wiping them first", async () => {
    window.history.replaceState(null, "", "/x?division=fbs&status=committed");
    const data = wireData([
      wireRow({
        eventId: 2,
        recruitmentId: 2,
        status: "committed",
        destination: { schoolId: "boise", subdivisionId: "fbs" },
      }),
      wireRow({ eventId: 1, recruitmentId: 1 }),
    ]);
    mockFetch(data);
    renderWire(data);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(window.location.search).toBe("?status=committed&division=fbs");
    expect(
      screen.getByRole("combobox", { name: "Divisions" }),
    ).toHaveTextContent("FBS");
  });

  it("puts every filter in a sheet on phones", async () => {
    const data = wireData([wireRow()]);
    mockFetch(data);
    const user = userEvent.setup();
    renderWire(data);
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("1 player match")).toBeInTheDocument();
    expect(
      within(sheet).getByRole("combobox", { name: "Divisions" }),
    ).toBeInTheDocument();
    await user.click(
      within(sheet).getByRole("checkbox", { name: "Grad transfers" }),
    );
    expect(
      // The open sheet hides the page from the accessibility tree.
      screen.getByRole("button", { name: "Filters · 1", hidden: true }),
    ).toBeInTheDocument();
    expect(within(sheet).getByText("0 players match")).toBeInTheDocument();
  });

  it("reads when a player's facts or school are missing", () => {
    const data = wireData([
      wireRow({ eventId: 3, recruitmentId: 3, origin: {} }),
      wireRow({
        eventId: 2,
        recruitmentId: 2,
        origin: { divisionId: "d1" },
        type: "withdrew",
        status: "withdrawn",
      }),
      wireRow({ eventId: 1, recruitmentId: 1 }),
    ]);
    renderWire(data);
    const [none, levelOnly] = rows();
    expect(
      within(none!).getByRole("img", {
        name: "School path: unknown → undecided",
      }),
    ).toBeInTheDocument();
    expect(
      within(levelOnly!).getByRole("img", {
        name: "School path: returning to their school",
      }),
    ).toBeInTheDocument();
  });

  it("shows every school a player has been at, oldest first", () => {
    const data = wireData([
      wireRow({
        eventId: 2,
        recruitmentId: 2,
        type: "committed",
        status: "committed",
        path: [{ schoolName: "Carroll College" }, { schoolId: "boise" }],
        destination: { schoolName: "Rocky Mountain" },
      }),
      wireRow({
        eventId: 1,
        recruitmentId: 1,
        type: "withdrew",
        status: "withdrawn",
        path: [{ schoolId: "boise" }, { schoolId: "gone" }, {}],
      }),
    ]);
    renderWire(data);
    const [committed, withdrew] = rows();
    expect(
      within(committed!).getByRole("img", {
        name: "School path: Carroll College → Boise State University → Montana → Rocky Mountain",
      }),
    ).toBeInTheDocument();
    // An earlier school we can't name is left out; one we've lost reads as unknown.
    expect(
      within(withdrew!).getByRole("img", {
        name: "School path: Boise State University → Unknown school → returning to Montana",
      }),
    ).toBeInTheDocument();
  });

  it("names filters from a shared link even when they match nothing", async () => {
    window.history.replaceState(null, "", "/x?division=nope&school=gone");
    const data = wireData([wireRow()]);
    mockFetch(data);
    renderWire(data);
    expect(
      await screen.findByRole("button", { name: "Remove filter: nope" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove filter: School" }),
    ).toBeInTheDocument();
  });

  it("goes back to everything when All is picked", async () => {
    const data = wireData([
      wireRow({ eventId: 2, recruitmentId: 2, position: "WR" }),
      wireRow({ eventId: 1, recruitmentId: 1, position: "QB" }),
    ]);
    mockFetch(data);
    const user = userEvent.setup();
    renderWire(data);
    await pick(user, "Positions", "WR");
    expect(rows()).toHaveLength(1);
    await pick(user, "Positions", "All positions");
    expect(rows()).toHaveLength(2);
    expect(window.location.search).toBe("");
  });

  it("shows gaps in a long page list", async () => {
    mockFetch(wireData(many(130)));
    const user = userEvent.setup();
    renderWire(wireData(many(50)), wireData(many(130)));
    const pages = screen.getByRole("navigation", { name: "Pages" });
    expect(within(pages).getByText("…")).toBeInTheDocument();
    expect(
      within(pages).getByRole("button", { name: "6" }),
    ).toBeInTheDocument();
    await user.click(within(pages).getByRole("button", { name: "6" }));
    await waitFor(() =>
      expect(screen.getByText("Showing 126–130 of 130")).toBeInTheDocument(),
    );
  });

  it("says when no one has entered yet", () => {
    renderWire(wireData([]), wireData([]), "lacrosse");
    expect(
      screen.getByText("No one has entered the portal yet this cycle."),
    ).toBeInTheDocument();
    expect(screen.getByText("No players")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull();
  });
});
