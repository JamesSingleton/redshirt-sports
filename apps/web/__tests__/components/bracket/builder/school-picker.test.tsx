import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SchoolPicker } from "@/components/bracket/builder/school-picker";

const schools = [
  {
    schoolId: "msu",
    name: "Montana State University",
    shortName: "Montana State",
    abbreviation: "MSU",
    slug: "montana-state",
    image: null,
    conference: "Big Sky",
  },
  {
    schoolId: "leh",
    name: "Lehigh University",
    shortName: null,
    abbreviation: "LEH",
    slug: "lehigh",
    image: null,
    conference: "Patriot",
  },
  {
    schoolId: "anon",
    name: null,
    shortName: null,
    abbreviation: null,
    slug: null,
    image: null,
    conference: null,
  },
];

function renderPicker(props: Partial<Parameters<typeof SchoolPicker>[0]> = {}) {
  const onPlace = vi.fn();
  render(
    <SchoolPicker
      slotLabel="No. 1 seed"
      seed={1}
      current={null}
      schools={schools}
      placed={new Set(["leh"])}
      onPlace={onPlace}
      {...props}
    />,
  );
  return onPlace;
}

describe("SchoolPicker", () => {
  beforeAll(() => {
    // cmdk scrolls the highlighted item into view.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("fills an open spot from a searchable list", async () => {
    const onPlace = renderPicker();
    const trigger = screen.getByRole("button", {
      name: "Choose the No. 1 seed",
    });
    expect(trigger).toHaveTextContent("1Choose team");

    await userEvent.click(trigger);
    expect(screen.queryByText("Remove team")).toBeNull();
    // A school already in the bracket says it will swap.
    expect(
      screen.getByRole("option", { name: /Lehigh University/ }),
    ).toHaveTextContent("Swap");
    expect(screen.getByRole("option", { name: /^School/ })).toBeInTheDocument();

    await userEvent.type(
      screen.getByPlaceholderText("Search for the No. 1 seed…"),
      "montana",
    );
    expect(screen.queryByRole("option", { name: /Lehigh/ })).toBeNull();
    await userEvent.click(
      screen.getByRole("option", { name: /Montana State/ }),
    );
    expect(onPlace).toHaveBeenCalledWith("msu");
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("changes or removes the team in a filled spot", async () => {
    const onPlace = renderPicker({
      current: schools[0],
      placed: new Set(["msu"]),
    });
    const trigger = screen.getByRole("button", {
      name: "Change the No. 1 seed: Montana State",
    });
    await userEvent.click(trigger);
    expect(screen.getByLabelText("Selected")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Lehigh University/ }),
    ).toHaveTextContent("Patriot");

    await userEvent.click(screen.getByRole("option", { name: "Remove team" }));
    expect(onPlace).toHaveBeenCalledWith(null);
  });

  it("leaves out the seed column for a spot with no seed", () => {
    renderPicker({ slotLabel: "team playing the No. 9 seed", seed: null });
    expect(
      screen.getByRole("button", {
        name: "Choose the team playing the No. 9 seed",
      }),
    ).toHaveTextContent(/^Choose team$/);
  });
});
