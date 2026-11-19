import {
  type ReorderMessage,
  reorderMessage,
  SortableList,
  SortableListDown,
  SortableListHandle,
  SortableListItem,
  SortableListUp,
} from "@redshirt-sports/ui/components/sortable-list";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

declare global {
  var __UI_SDK_STRICT__: boolean | undefined;
}

function List({
  initial = ["Alpha", "Bravo", "Charlie"],
  onChange,
  message,
  isDisabled,
}: {
  initial?: string[];
  onChange?: (value: string[]) => void;
  message?: (message: ReorderMessage) => string;
  isDisabled?: (key: string) => boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <SortableList
      aria-label="Teams"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      isDisabled={isDisabled}
      message={message}
    >
      {({ order }) =>
        order.map((key) => (
          <SortableListItem key={key} value={key}>
            <span>{key}</span>
            <input aria-label={`${key} note`} />
            <SortableListHandle aria-label={`Drag ${key}`} />
            <SortableListUp aria-label={`Move ${key} up`} />
            <SortableListDown aria-label={`Move ${key} down`} />
          </SortableListItem>
        ))
      }
    </SortableList>
  );
}

function names() {
  return within(screen.getByRole("list", { name: "Teams" }))
    .getAllByRole("listitem")
    .map((item) => item.querySelector("span")?.textContent);
}

describe("SortableList", () => {
  beforeAll(() => {
    globalThis.__UI_SDK_STRICT__ = true;
  });
  afterAll(() => {
    globalThis.__UI_SDK_STRICT__ = undefined;
  });

  it("moves an item with its up and down buttons, and not past either end", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<List onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Move Charlie up" }));
    expect(names()).toEqual(["Alpha", "Charlie", "Bravo"]);

    const top = screen.getByRole("button", { name: "Move Alpha up" });
    expect(top).toHaveAttribute("aria-disabled", "true");
    await user.click(top);
    await user.click(screen.getByRole("button", { name: "Move Bravo down" }));
    expect(names()).toEqual(["Alpha", "Charlie", "Bravo"]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("moves the focused item with Alt and the arrows, keeping focus on it", async () => {
    const user = userEvent.setup();
    render(<List />);

    const note = screen.getByRole("textbox", { name: "Alpha note" });
    await user.click(note);
    await user.keyboard("{Alt>}{ArrowDown}{ArrowDown}{/Alt}");
    expect(names()).toEqual(["Bravo", "Charlie", "Alpha"]);
    expect(note).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(names()).toEqual(["Bravo", "Charlie", "Alpha"]);
  });

  it("picks an item up by its handle and drops it with Space", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<List onChange={onChange} />);

    const handle = screen.getByRole("button", { name: "Drag Alpha" });
    handle.focus();
    await user.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowDown}");
    expect(names()).toEqual(["Bravo", "Alpha", "Charlie"]);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(["Bravo", "Alpha", "Charlie"]);
    expect(handle).toHaveAttribute("aria-pressed", "false");
  });

  it("puts a picked-up item back on Escape", async () => {
    const user = userEvent.setup();
    render(<List />);

    screen.getByRole("button", { name: "Drag Bravo" }).focus();
    await user.keyboard(" {ArrowUp}{Escape}");
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("won't pick up a disabled item", async () => {
    const user = userEvent.setup();
    render(<List isDisabled={(key) => key === "Bravo"} />);

    const handle = screen.getByRole("button", { name: "Drag Bravo" });
    handle.focus();
    await user.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "false");
  });

  it("announces moves with a custom message", async () => {
    const message = vi.fn(
      (m: ReorderMessage) => `${m.label}, moved to ${m.position} of ${m.total}`,
    );
    const user = userEvent.setup();
    render(<List message={message} />);

    await user.click(screen.getByRole("button", { name: "Move Alpha down" }));
    expect(message).toHaveBeenCalledWith(
      expect.objectContaining({ type: "drop", position: 2, total: 3 }),
    );
  });

  it("re-exports the default English messages", () => {
    expect(
      reorderMessage({
        type: "drop",
        key: "a",
        label: "Alpha",
        count: 1,
        position: 2,
        total: 3,
      }),
    ).toContain("Alpha");
  });
});
