import {
  CellGrid,
  CellGridCell,
} from "@redshirt-sports/ui/components/cell-grid";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

declare global {
  var __UI_SDK_STRICT__: boolean | undefined;
}

function Grid({ onActiveChange }: { onActiveChange?: () => void }) {
  return (
    <CellGrid
      aria-label="Scores"
      rows={2}
      cols={2}
      onActiveChange={onActiveChange}
    >
      <tbody>
        {[0, 1].map((row) => (
          <tr key={row}>
            <th scope="row">Row {row}</th>
            {[0, 1].map((col) => (
              <CellGridCell key={col} id={`${row}:${col}`} row={row} col={col}>
                {`${row}-${col}`}
              </CellGridCell>
            ))}
          </tr>
        ))}
      </tbody>
    </CellGrid>
  );
}

describe("CellGrid", () => {
  beforeAll(() => {
    globalThis.__UI_SDK_STRICT__ = true;
  });
  afterAll(() => {
    globalThis.__UI_SDK_STRICT__ = undefined;
  });

  it("is one tab stop that arrow keys move by row and column", async () => {
    const onActiveChange = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Grid onActiveChange={onActiveChange} />
        <button type="button">After</button>
      </>,
    );

    expect(screen.getByRole("grid", { name: "Scores" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(screen.getByRole("gridcell", { name: "0-0" })).toHaveFocus();

    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: "1-1" })).toHaveFocus();
    expect(onActiveChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ row: 1, col: 1 }),
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("gridcell", { name: "1-1" })).toHaveFocus();
  });

  it("makes a pressed cell active", async () => {
    const onActiveChange = vi.fn();
    const user = userEvent.setup();
    render(<Grid onActiveChange={onActiveChange} />);

    await user.click(screen.getByRole("gridcell", { name: "1-0" }));
    expect(onActiveChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ row: 1, col: 0 }),
    );
    expect(screen.getByRole("gridcell", { name: "1-0" })).toHaveAttribute(
      "data-active",
    );
  });
});
