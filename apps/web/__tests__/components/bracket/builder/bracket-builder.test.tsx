import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import {
  bracketEdition,
  bracketSlots,
  FCS_SPEC,
} from "@/__tests__/helpers/bracket-fixtures";
import {
  type BracketDraft,
  bracketDraftStorageKey,
  pickWinner,
  seedDraft,
} from "@/lib/bracket-builder";
import type { BracketBuilderModel } from "@/lib/bracket-data";

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  captureImage: vi.fn(),
  downloadBlob: vi.fn(),
  toastError: vi.fn(),
  frameDetached: false,
  /** What the stubbed school picker places when selected. */
  nextSchool: null as string | null,
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mocks.capture },
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("@/lib/bracket-capture", () => ({
  captureBracketImage: mocks.captureImage,
}));
vi.mock("@/lib/download-blob", () => ({ downloadBlob: mocks.downloadBlob }));
vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span data-testid="logo">{alt}</span>,
}));
vi.mock("@/components/bracket/builder/school-picker", () => ({
  SchoolPicker: ({
    slotLabel,
    current,
    onPlace,
  }: {
    slotLabel: string;
    current: { schoolId: string } | null;
    onPlace: (schoolId: string | null) => void;
  }) => (
    <button type="button" onClick={() => onPlace(mocks.nextSchool)}>
      {current ? "Change" : "Choose"} the {slotLabel}
    </button>
  ),
}));
vi.mock(
  "@/components/bracket/builder/bracket-export-frame",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/components/bracket/builder/bracket-export-frame")
      >();
    return {
      BracketExportFrame: (
        props: Parameters<typeof original.BracketExportFrame>[0],
      ): ReactNode =>
        mocks.frameDetached ? null : <original.BracketExportFrame {...props} />,
    };
  },
);

import { BracketBuilder } from "@/components/bracket/builder/bracket-builder";

const KEY = "fcs-24-seed16-v2024";
const STORAGE = bracketDraftStorageKey("football", "fcs", KEY);
const schools = bracketSlots().map((slot) => ({
  ...slot.team,
  conference: "Big Sky",
}));

function model(overrides: Partial<BracketBuilderModel> = {}) {
  return {
    sport: "football",
    division: "fcs",
    year: 2026,
    formatKey: KEY,
    spec: FCS_SPEC,
    projection: { edition: bracketEdition(), slots: bracketSlots() },
    schools,
    ...overrides,
  } satisfies BracketBuilderModel;
}

function save(draft: BracketDraft) {
  window.localStorage.setItem(STORAGE, JSON.stringify(draft));
}
const saved = () =>
  JSON.parse(window.localStorage.getItem(STORAGE) ?? "null") as BracketDraft;

/** Our field with every game picked except the championship. */
function almostDone() {
  let draft = seedDraft(KEY, FCS_SPEC, bracketSlots());
  for (const game of FCS_SPEC.games) {
    if (game.key !== "final")
      draft = pickWinner(FCS_SPEC, draft, game.key, "a");
  }
  return draft;
}

const frame = () => document.querySelector("[data-print-frame]")!;
const events = (name: string) =>
  mocks.capture.mock.calls.filter(([event]) => event === name);
const picks = () =>
  screen.queryAllByRole("button", { name: /: pick .* to win$/ });

describe("BracketBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.capture.mockReset();
    mocks.captureImage.mockReset().mockResolvedValue(new Blob(["png"]));
    mocks.downloadBlob.mockReset();
    mocks.toastError.mockReset();
    mocks.frameDetached = false;
    mocks.nextSchool = null;
    // happy-dom has no print dialog.
    window.print = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it("asks how to start, then starts from our projection", async () => {
    render(<BracketBuilder model={model()} logo={null} />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Build Your 2026 FCS Playoff Bracket",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("How do you want to start?")).toBeInTheDocument();
    expect(picks()).toHaveLength(0);
    expect(screen.queryByLabelText("Bracket name")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Start from our Week 7 projection" }),
    );
    expect(screen.queryByText("How do you want to start?")).toBeNull();
    expect(picks().length).toBeGreaterThan(0);
    expect(Object.keys(saved().slots)).toHaveLength(24);
    expect(events("bracket_builder_started")).toEqual([
      [
        "bracket_builder_started",
        expect.objectContaining({
          from: "projection",
          sport: "football",
          division: "fcs",
          year: 2026,
          teams_placed: 24,
          picks_made: 0,
        }),
      ],
    ]);
  });

  it("starts from scratch with every spot open", async () => {
    render(<BracketBuilder model={model()} logo={null} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Start from scratch" }),
    );
    expect(picks()).toHaveLength(0);
    expect(
      screen.getAllByRole("button", { name: /^Choose the / }),
    ).toHaveLength(24);
    expect(events("bracket_builder_started")[0]?.[1]).toMatchObject({
      from: "blank",
      teams_placed: 0,
    });
  });

  it("needs no prompt without a projection, and counts the first team as the start", async () => {
    render(<BracketBuilder model={model({ projection: null })} logo={null} />);
    expect(screen.queryByText("How do you want to start?")).toBeNull();
    const startOver = screen.getByRole("button", { name: "Start over" });
    expect(startOver).toBeDisabled();

    mocks.nextSchool = "school-3";
    await userEvent.click(
      screen.getByRole("button", { name: "Choose the No. 1 seed" }),
    );
    expect(saved().slots).toEqual({ "seed-1": "school-3" });
    // One team is not a game: there is nobody to pick it over yet.
    expect(picks()).toHaveLength(0);
    expect(events("bracket_builder_started")).toHaveLength(1);
    expect(events("bracket_builder_started")[0]?.[1]).toMatchObject({
      from: "blank",
      teams_placed: 1,
    });

    mocks.nextSchool = "school-4";
    await userEvent.click(
      screen.getByRole("button", { name: "Choose the No. 2 seed" }),
    );
    expect(events("bracket_builder_started")).toHaveLength(1);

    // Changing a placed team: the stub removes it.
    mocks.nextSchool = null;
    await userEvent.click(
      screen.getByRole("button", { name: "Change the No. 2 seed" }),
    );
    expect(saved().slots).toEqual({ "seed-1": "school-3" });

    expect(startOver).toBeEnabled();
    await userEvent.click(startOver);
    expect(
      screen.queryByRole("button", { name: /^Our .* projection$/ }),
    ).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Blank bracket" }),
    );
    expect(saved().slots).toEqual({});
    expect(events("bracket_builder_restarted")[0]?.[1]).toMatchObject({
      from: "blank",
    });
  });

  it("restores a saved bracket and records the champion once", async () => {
    save({ ...almostDone(), title: "Chalk" });
    render(<BracketBuilder model={model()} logo={null} />);
    expect(screen.queryByText("How do you want to start?")).toBeNull();
    expect(screen.getByLabelText("Bracket name")).toHaveValue("Chalk");
    expect(frame()).toHaveTextContent("Chalk");
    expect(frame()).toHaveTextContent("Redshirt Sports bracket builder");

    const finalists = screen.getAllByRole("button", {
      name: /^Championship: pick .* to win$/,
    });
    expect(finalists).toHaveLength(2);
    await userEvent.click(finalists[0]!);
    expect(finalists[0]).toHaveAttribute("aria-pressed", "true");
    expect(events("bracket_builder_completed")).toEqual([
      [
        "bracket_builder_completed",
        expect.objectContaining({
          champion: expect.stringMatching(/^School \d+$/),
          picks_made: FCS_SPEC.games.length,
          has_title: true,
        }),
      ],
    ]);
    expect(frame()).toHaveTextContent(/Champion: School \d+/);

    // Changing the champion is not a second completion.
    await userEvent.click(finalists[1]!);
    expect(events("bracket_builder_completed")).toHaveLength(1);

    const clear = screen.getByRole("button", { name: "Clear picks" });
    await userEvent.click(clear);
    expect(saved().picks).toEqual({});
    expect(clear).toBeDisabled();
    expect(events("bracket_builder_picks_cleared")).toHaveLength(1);
  });

  it("records the field being completed once", async () => {
    const draft = seedDraft(KEY, FCS_SPEC, bracketSlots());
    delete draft.slots["seed-1"];
    save(draft);
    render(<BracketBuilder model={model()} logo={null} />);

    mocks.nextSchool = "school-1";
    await userEvent.click(
      screen.getByRole("button", { name: "Choose the No. 1 seed" }),
    );
    expect(events("bracket_builder_field_completed")[0]?.[1]).toMatchObject({
      teams_placed: 24,
    });

    mocks.nextSchool = "school-2";
    await userEvent.click(
      screen.getByRole("button", { name: "Change the No. 1 seed" }),
    );
    expect(saved().slots["seed-1"]).toBe("school-2");
    expect(saved().slots["seed-2"]).toBe("school-1");
    expect(events("bracket_builder_field_completed")).toHaveLength(1);
  });

  it("names the bracket on the page that gets exported", async () => {
    save(seedDraft(KEY, FCS_SPEC, bracketSlots()));
    render(<BracketBuilder model={model()} logo={{ id: "image-logo" }} />);
    expect(screen.getByTestId("logo")).toHaveTextContent("Redshirt Sports");
    expect(frame()).toHaveTextContent("My 2026 FCS Playoff Bracket");

    await userEvent.type(screen.getByLabelText("Bracket name"), "Dad's picks");
    expect(frame()).toHaveTextContent("Dad's picks");
    expect(saved().title).toBe("Dad's picks");
  });

  it("works for the visit when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<BracketBuilder model={model()} logo={null} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Start from our Week 7 projection" }),
    );
    expect(picks().length).toBeGreaterThan(0);
  });

  it("downloads the bracket as an image", async () => {
    save(seedDraft(KEY, FCS_SPEC, bracketSlots()));
    render(<BracketBuilder model={model()} logo={null} />);
    const button = screen.getByRole("button", { name: "Download image" });

    let finish: (blob: Blob) => void = () => {};
    mocks.captureImage.mockReturnValueOnce(
      new Promise<Blob>((resolve) => {
        finish = resolve;
      }),
    );
    await userEvent.click(button);
    expect(button).toBeDisabled();
    const blob = new Blob(["png"]);
    await act(async () => finish(blob));
    expect(button).toBeEnabled();
    expect(mocks.captureImage).toHaveBeenCalledWith(frame());
    expect(mocks.downloadBlob).toHaveBeenCalledWith(
      blob,
      "redshirt-sports-fcs-playoff-bracket-2026.png",
    );
    expect(events("bracket_builder_exported")[0]?.[1]).toMatchObject({
      method: "image",
      has_champion: false,
      teams_placed: 24,
    });

    mocks.captureImage.mockRejectedValueOnce(new Error("tainted"));
    await userEvent.click(button);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(1));
    expect(events("bracket_builder_export_failed")).toHaveLength(1);
    expect(mocks.downloadBlob).toHaveBeenCalledTimes(1);
  });

  it("prints the bracket, or a blank one, without touching the draft", async () => {
    const draft = seedDraft(KEY, FCS_SPEC, bracketSlots());
    save(draft);
    render(<BracketBuilder model={model()} logo={null} />);
    const printed: string[] = [];
    vi.mocked(window.print).mockImplementation(() => {
      printed.push(frame().textContent ?? "");
    });

    fireEvent(window, new Event("beforeprint"));
    expect(
      (frame() as HTMLElement).style.getPropertyValue("--bracket-print-zoom"),
    ).toBe("1");

    await userEvent.click(
      screen.getByRole("button", { name: "Print or save as PDF" }),
    );
    expect(printed[0]).toContain("My 2026 FCS Playoff Bracket");
    expect(printed[0]).toContain("School 1");

    await userEvent.click(
      screen.getByRole("button", { name: "Print a blank bracket" }),
    );
    expect(printed[1]).toContain("2026 FCS Playoff Bracket");
    expect(printed[1]).toContain("Fill in your picks");
    expect(printed[1]).not.toContain("School 1");
    expect(printed[1]).not.toContain("TBD");
    expect(frame()).toHaveTextContent("Fill in your picks");

    act(() => {
      fireEvent(window, new Event("afterprint"));
    });
    expect(frame()).toHaveTextContent("My 2026 FCS Playoff Bracket");
    expect(saved()).toEqual(draft);
    expect(
      events("bracket_builder_exported").map(([, props]) => props.method),
    ).toEqual(["print", "print_blank"]);
  });

  it("replaces the bracket only after confirming", async () => {
    save(pickWinner(FCS_SPEC, seedDraft(KEY, FCS_SPEC, []), "final", "a"));
    render(<BracketBuilder model={model()} logo={null} />);

    await userEvent.click(screen.getByRole("button", { name: "Start over" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Keep my bracket" }),
    );
    expect(saved().slots).toEqual({});

    await userEvent.click(screen.getByRole("button", { name: "Start over" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Our Week 7 projection" }),
    );
    expect(Object.keys(saved().slots)).toHaveLength(24);
    expect(events("bracket_builder_restarted")[0]?.[1]).toMatchObject({
      from: "projection",
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("does nothing to export when the frame is not on the page", async () => {
    mocks.frameDetached = true;
    render(<BracketBuilder model={model({ projection: null })} logo={null} />);
    fireEvent(window, new Event("beforeprint"));
    await userEvent.click(
      screen.getByRole("button", { name: "Download image" }),
    );
    expect(mocks.captureImage).not.toHaveBeenCalled();
  });
});
