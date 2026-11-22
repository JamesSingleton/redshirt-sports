const { mockListPolls } = vi.hoisted(() => ({ mockListPolls: vi.fn() }));
vi.mock("@redshirt-sports/db/queries", () => ({ listPolls: mockListPolls }));

import { readChoices } from "@/lib/newsletter/choices";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const WEEKLY = "The Week in College Sports, every Sunday morning";

describe("readChoices", () => {
  beforeEach(() =>
    mockListPolls.mockResolvedValue([
      { id: "poll-fcs", name: "FCS Top 25", sport: { name: "Football" } },
    ]),
  );
  afterEach(() => vi.clearAllMocks());

  it("means the weekly issue from a form without choices", async () => {
    expect(await readChoices(form([]))).toEqual({
      digest: true,
      pollIds: [],
      labels: [WEEKLY],
    });
    expect(mockListPolls).not.toHaveBeenCalled();
  });

  it("keeps ticked active polls and drops anything else", async () => {
    expect(
      await readChoices(
        form([
          ["choices", "1"],
          ["poll", "poll-fcs"],
          ["poll", "poll-made-up"],
        ]),
      ),
    ).toEqual({
      digest: false,
      pollIds: ["poll-fcs"],
      labels: ["Football: FCS Top 25 alerts"],
    });
  });

  it("takes the weekly issue alone", async () => {
    expect(
      await readChoices(
        form([
          ["choices", "1"],
          ["digest", "on"],
        ]),
      ),
    ).toMatchObject({ digest: true, pollIds: [], labels: [WEEKLY] });
  });

  it("is null when nothing real is ticked", async () => {
    expect(await readChoices(form([["choices", "1"]]))).toBeNull();
    expect(
      await readChoices(
        form([
          ["choices", "1"],
          ["poll", "nope"],
        ]),
      ),
    ).toBeNull();
  });
});
