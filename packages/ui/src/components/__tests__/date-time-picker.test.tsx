import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DateTimePicker } from "../date-time-picker";

describe("DateTimePicker", () => {
  it("shows the day and time of a wall-clock value", () => {
    render(<DateTimePicker value="2026-11-28T14:00" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Date" })).toHaveTextContent(
      "Sat, Nov 28",
    );
    expect(screen.getByLabelText("Time")).toHaveValue("14:00");
  });

  it("keeps the time disabled until a day is picked", () => {
    render(<DateTimePicker value={null} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Date" })).toHaveTextContent(
      "Pick a date",
    );
    expect(screen.getByLabelText("Time")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });

  it("picks a day with the default time, then keeps the chosen time", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateTimePicker value={null} onChange={onChange} defaultTime="14:00" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Date" }));
    await userEvent.click(screen.getAllByRole("button", { name: /15th/ })[0]!);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-15T14:00$/),
    );

    rerender(<DateTimePicker value="2026-11-28T14:00" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Time"), {
      target: { value: "19:30" },
    });
    expect(onChange).toHaveBeenLastCalledWith("2026-11-28T19:30");
  });

  it("clears the value", async () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-11-28T14:00" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
