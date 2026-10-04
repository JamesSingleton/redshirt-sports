import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import {
  FilterCombobox,
  RouteFilterCombobox,
} from "@/components/filter-combobox";

const options = [
  { value: "all", label: "All conferences" },
  { value: "mvfc", label: "MVFC", keywords: "Missouri Valley Football" },
  { value: "caa", label: "CAA", keywords: "Coastal Athletic Association" },
];

describe("FilterCombobox", () => {
  it("shows the selected option on the trigger", () => {
    render(
      <FilterCombobox
        label="Conference"
        options={options}
        value="mvfc"
        onValueChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Conference: MVFC" }),
    ).toHaveTextContent("Conference: MVFC");
  });

  it("falls back to the first option for an unknown value", () => {
    render(
      <FilterCombobox
        label="Conference"
        options={options}
        value="missing"
        onValueChange={vi.fn()}
        className="sm:w-72"
      />,
    );

    const trigger = screen.getByRole("combobox", {
      name: "Conference: All conferences",
    });
    expect(trigger).toHaveClass("sm:w-72");
  });

  it("renders an empty label when there are no options", () => {
    render(
      <FilterCombobox
        label="Conference"
        options={[]}
        value="all"
        onValueChange={vi.fn()}
        pending
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Conference:" });
    expect(trigger).toHaveAttribute("aria-busy", "true");
  });

  it("searches labels and full names from an empty search box", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterCombobox
        label="Conference"
        options={options}
        value="caa"
        onValueChange={onValueChange}
        searchPlaceholder="Search conferences"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Conference: CAA" }));
    const search = await screen.findByPlaceholderText("Search conferences");
    expect(search).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.type(search, "missouri");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "MVFC" }));

    expect(onValueChange).toHaveBeenCalledWith("mvfc");
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(
      <FilterCombobox
        label="Conference"
        options={options}
        value="all"
        onValueChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Conference: All conferences" }),
    );
    await user.type(
      await screen.findByPlaceholderText("Search conference"),
      "zzz",
    );

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No matches.")).toBeInTheDocument();
  });
});

describe("RouteFilterCombobox", () => {
  const items = [
    {
      key: "all",
      label: "All conferences",
      href: "/college/football/news/fcs",
    },
    {
      key: "mvfc",
      label: "MVFC",
      href: "/college/football/news/fcs/mvfc",
      keywords: "Missouri Valley Football",
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders nothing without items", () => {
    const { container } = render(
      <RouteFilterCombobox label="Conference" items={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("defaults to the first item and navigates to a new selection", async () => {
    const user = userEvent.setup();
    render(<RouteFilterCombobox label="Conference" items={items} />);

    await user.click(
      screen.getByRole("combobox", { name: "Conference: All conferences" }),
    );
    await user.click(await screen.findByRole("option", { name: "MVFC" }));

    expect(mockPush).toHaveBeenCalledWith("/college/football/news/fcs/mvfc");
  });

  it("does not navigate when the active item is picked again", async () => {
    const user = userEvent.setup();
    render(
      <RouteFilterCombobox
        label="Conference"
        items={items}
        activeHref="/college/football/news/fcs/mvfc"
        searchPlaceholder="Search conferences"
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Conference: MVFC" }),
    );
    expect(
      await screen.findByPlaceholderText("Search conferences"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "MVFC" }));

    expect(mockPush).not.toHaveBeenCalled();
  });
});
