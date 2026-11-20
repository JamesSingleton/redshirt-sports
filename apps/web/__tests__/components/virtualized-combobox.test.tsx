import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ordinal,
  schoolMatchScore,
  VirtualizedCombobox,
} from "@/components/virtualized-combobox";

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ image }: { image?: { alt?: string } }) => (
    <img alt={image?.alt ?? "school"} />
  ),
}));

const options = [
  {
    _id: "school-1",
    name: "University of Alabama",
    shortName: "Alabama",
    abbreviation: "ALA",
    image: { alt: "Alabama" },
  },
  {
    _id: "school-2",
    name: "University of Georgia",
    shortName: "Georgia",
    abbreviation: "UGA",
    image: null,
  },
  {
    _id: "school-3",
    name: "University of Montana",
    shortName: "Montana",
    abbreviation: "UM",
    image: null,
  },
  {
    _id: "school-4",
    name: "Montana State University",
    shortName: "Montana State",
    abbreviation: "MSU",
    image: null,
  },
  {
    _id: "school-5",
    name: "University of Minnesota",
    shortName: "Minnesota",
    abbreviation: "MINN",
    image: null,
  },
  {
    _id: "school-6",
    name: "University of Northern Test",
    shortName: null,
    abbreviation: null,
    image: null,
  },
  {
    _id: "school-7",
    name: "University of Southern Test",
    shortName: null,
    abbreviation: null,
    image: null,
  },
] as never;

describe("VirtualizedCombobox", () => {
  async function open(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Rank 1" }));
    return screen.getByRole("listbox");
  }

  it("opens the list and picks a school", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        ballot={[]}
        onChange={onChange}
        searchPlaceholder="Pick a school"
      />,
    );

    expect(screen.getByRole("button", { name: "Rank 1" })).toHaveTextContent(
      "Pick a school",
    );
    const list = await open(user);
    await user.click(within(list).getByRole("option", { name: /Alabama/ }));

    expect(onChange).toHaveBeenCalledWith("school-1");
  });

  it("shows the picked school with its logo", () => {
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        ballot={[]}
        value="school-1"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Rank 1" });
    expect(trigger).toHaveTextContent("Alabama");
    expect(within(trigger).getByRole("img", { name: "Alabama" })).toBeVisible();
  });

  it("lists schools on the ballot with where they're ranked", async () => {
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        ballot={["school-1", "", "school-2"]}
        value="school-1"
      />,
    );

    const list = await open(user);
    expect(
      within(list).getByRole("option", { name: /Alabama/ }),
    ).not.toHaveTextContent("currently");
    expect(
      within(list).getByRole("option", { name: "Georgia · currently 3rd" }),
    ).toBeVisible();
  });

  it("writes ranks as ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 25].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "23rd",
      "25th",
    ]);
  });

  it("searches names, short names and abbreviations", async () => {
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox aria-label="Rank 1" options={options} ballot={[]} />,
    );

    const list = await open(user);
    const search = screen.getByRole("combobox", { name: "Search schools" });

    await user.type(search, "Mont");
    expect(
      within(list)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Montana", "Montana State"]);

    await user.clear(search);
    await user.type(search, "UGA");
    expect(within(list).getAllByRole("option")).toHaveLength(1);

    await user.clear(search);
    await user.type(search, "University");
    expect(within(list).getAllByRole("option")).toHaveLength(7);

    await user.clear(search);
    await user.type(search, "zzz");
    expect(screen.getByText("No school found.")).toBeVisible();
  });

  it("returns focus to the trigger after a pick, unless the pick moved it", async () => {
    let moveFocus = false;
    const user = userEvent.setup();
    render(
      <>
        <VirtualizedCombobox
          aria-label="Rank 1"
          options={options}
          ballot={[]}
          onChange={() => {
            if (moveFocus)
              screen.getByRole("button", { name: "Elsewhere" }).focus();
          }}
        />
        <button type="button">Elsewhere</button>
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Rank 1" });
    let list = await open(user);
    await user.click(within(list).getByRole("option", { name: /Georgia/ }));
    await waitFor(() => expect(trigger).toHaveFocus());

    moveFocus = true;
    list = await open(user);
    await user.click(within(list).getByRole("option", { name: /Georgia/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus(),
    );
  });

  it("clears the pick", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        ballot={[]}
        value="school-1"
        onChange={onChange}
      />,
    );

    const list = await open(user);
    await user.click(
      within(list).getByRole("option", { name: "Clear this pick" }),
    );
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("ranks a prefix match above a match inside a name", () => {
    const item = { value: "a", label: "Montana State", keywords: ["MSU"] };
    expect(schoolMatchScore(item, "")).toBe(true);
    expect(schoolMatchScore(item, "msu")).toBe(2);
    expect(schoolMatchScore(item, "state")).toBe(1);
    expect(schoolMatchScore(item, "boise")).toBe(false);
    expect(schoolMatchScore({ value: "b", label: "Lamar" }, "lam")).toBe(2);
    expect(schoolMatchScore({ value: "__clear", label: "Clear" }, "c")).toBe(
      false,
    );
  });
});
