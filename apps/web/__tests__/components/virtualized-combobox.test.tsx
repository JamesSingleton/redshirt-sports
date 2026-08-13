import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VirtualizedCombobox } from "@/components/virtualized-combobox";

const { mockUseVirtualizer } = vi.hoisted(() => ({
  mockUseVirtualizer: vi.fn(
    ({
      count,
      getScrollElement,
      estimateSize,
    }: {
      count: number;
      getScrollElement: () => HTMLElement | null;
      estimateSize: () => number;
    }) => {
      getScrollElement();
      estimateSize();

      return {
        getVirtualItems: () =>
          Array.from({ length: count }, (_, index) => ({
            index,
            size: 35,
            start: index * 35,
          })),
        getTotalSize: () => count * 35,
      };
    },
  ),
}));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: mockUseVirtualizer,
}));

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
] as never;

describe("VirtualizedCombobox", () => {
  it("opens the popover and selects a school", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        options={options}
        selectedOptions={[]}
        onChange={onChange}
        searchPlaceholder="Pick a school"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Alabama"));

    expect(onChange).toHaveBeenCalledWith("school-1");
  });

  it("filters schools with search", async () => {
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        options={options}
        selectedOptions={["school-2"]}
        value="school-1"
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Select a school..."), "zzz");
    expect(screen.getByText("No school found.")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Select a school..."));
    await waitFor(() => {
      expect(screen.getAllByText("Alabama").length).toBeGreaterThan(0);
    });

    await user.type(
      screen.getByPlaceholderText("Select a school..."),
      "Alabama",
    );
    await waitFor(() => {
      expect(screen.getAllByText("Alabama").length).toBeGreaterThan(0);
    });
  });

  it("shows the placeholder when no school image is available", () => {
    render(
      <VirtualizedCombobox
        options={options}
        selectedOptions={[]}
        value=""
        searchPlaceholder="Choose team"
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Choose team");
  });

  it("deselects a chosen school when selecting it again", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        options={options}
        selectedOptions={[]}
        value="school-1"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    const alabamaOptions = screen.getAllByText("Alabama");
    await user.click(alabamaOptions[alabamaOptions.length - 1]!);

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("uses the trigger width when the popover opens", async () => {
    const user = userEvent.setup();
    render(
      <VirtualizedCombobox
        options={options}
        selectedOptions={[]}
        value="school-1"
      />,
    );

    const trigger = screen.getByRole("combobox");
    Object.defineProperty(trigger, "offsetWidth", {
      configurable: true,
      value: 240,
    });

    await user.click(trigger);
    expect(screen.getByText("Georgia")).toBeInTheDocument();
  });

  it("skips virtual rows when the filtered option is missing", async () => {
    const user = userEvent.setup();

    mockUseVirtualizer.mockImplementationOnce(
      ({
        count,
        getScrollElement,
      }: {
        count: number;
        getScrollElement: () => HTMLElement | null;
      }) => {
        getScrollElement();
        return {
          getVirtualItems: () => [
            { index: 99, size: 35, start: 0 },
            { index: 0, size: 35, start: 35 },
          ],
          getTotalSize: () => count * 35,
        };
      },
    );

    render(
      <VirtualizedCombobox options={options} selectedOptions={[]} value="" />,
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Alabama")).toBeInTheDocument();
    expect(screen.queryByText("Georgia")).not.toBeInTheDocument();
  });
});
