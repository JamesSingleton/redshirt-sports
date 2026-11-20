import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  schoolMatchScore,
  VirtualizedCombobox,
} from "@/components/legacy-ballot/virtualized-combobox";

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
        selectedOptions={[]}
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
        selectedOptions={[]}
        value="school-1"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Rank 1" });
    expect(trigger).toHaveTextContent("Alabama");
    expect(within(trigger).getByRole("img", { name: "Alabama" })).toBeVisible();
  });

  it("leaves out schools picked for other ranks", async () => {
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        selectedOptions={["school-1", "school-2"]}
        value="school-1"
      />,
    );

    const list = await open(user);
    expect(within(list).getByRole("option", { name: /Alabama/ })).toBeVisible();
    expect(within(list).queryByRole("option", { name: /Georgia/ })).toBeNull();
  });

  it("searches names, short names and abbreviations", async () => {
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        selectedOptions={[]}
      />,
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

  it("clears the pick", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        aria-label="Rank 1"
        options={options}
        selectedOptions={[]}
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
