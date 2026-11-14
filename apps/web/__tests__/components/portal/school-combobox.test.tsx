import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SchoolCombobox } from "@/components/portal/school-combobox";

const options = [
  { key: "boise", name: "Boise State", school: null },
  { key: "montana", name: "Montana", school: null },
];

describe("SchoolCombobox", () => {
  it("shows the pick, offers every school, and clears back to all", async () => {
    const onChange = vi.fn();
    const onOpen = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SchoolCombobox
        options={options}
        value="montana"
        onChange={onChange}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByRole("combobox", { name: "School" })).toHaveTextContent(
      "Montana",
    );
    await user.click(screen.getByRole("combobox", { name: "School" }));
    expect(onOpen).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("option", { name: /All schools/ }));
    expect(onChange).toHaveBeenLastCalledWith("");

    rerender(<SchoolCombobox options={options} value="" onChange={onChange} />);
    expect(screen.getByRole("combobox", { name: "School" })).toHaveTextContent(
      "All schools",
    );
    await user.click(screen.getByRole("combobox", { name: "School" }));
    await user.click(screen.getByRole("option", { name: /Boise State/ }));
    expect(onChange).toHaveBeenLastCalledWith("boise");

    // Escape closes it without picking anything.
    await user.click(screen.getByRole("combobox", { name: "School" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("names a pick that isn't in the list yet", () => {
    render(<SchoolCombobox options={[]} value="gone" onChange={() => {}} />);
    expect(screen.getByRole("combobox", { name: "School" })).toHaveTextContent(
      "Selected school",
    );
  });
});
