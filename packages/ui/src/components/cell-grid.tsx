"use client";

import {
  byCell,
  createGridFocus,
  definePrimitive,
  type GridCell,
  selects,
} from "@ui-sdk/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ComponentType, ReactNode } from "react";

type CellGridOptions = {
  rows: number;
  cols: number;
  /** Runs when the active cell moves: arrow keys, a press, or a tap. */
  onActiveChange?: (cell: GridCell) => void;
};

const cellGrid = definePrimitive({
  name: "cell-grid",
  options: { rows: "number", cols: "number", onActiveChange: "callback" },
  state: (_options: CellGridOptions) => ({ active: null as GridCell | null }),
  api: (context) => ({
    grid: createGridFocus(context, {
      key: "active",
      rows: () => context.options().rows,
      cols: () => context.options().cols,
      onMove: (cell) => context.options().onActiveChange?.(cell),
    }),
  }),
  slots: (slot) => ({
    root: slot({
      role: "grid",
      keys: { none: "Focus stays on a cell, whose keydown handles them." },
    }),
    cell: slot<{ id: string; row: number; col: number }>({
      props: { id: "string", row: "number", col: "number" },
      role: "gridcell",
      focus: "roving",
      selects: selects({ active: byCell }),
      keys: [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "mod+Home",
        "mod+End",
        "PageUp",
        "PageDown",
      ],
      attrs: (state, { props, api }) => ({
        tabindex: api.grid.tabIndex(state, props),
        "data-active": api.grid.isActive(state, props) ? "" : undefined,
      }),
      on: {
        keydown: (event, { api }) => api.grid.keydown(event),
        pointerdown: (event, { api, props }) =>
          api.grid.focus(props, { reason: "item-press", event }),
      },
      bind: (el, { api, props }) => api.grid.bind(el, props),
    }),
  }),
});

// Spelled out because the inferred part types name a type ui-sdk doesn't
// export, which this package's declaration build can't emit.
type CellGridProps = Omit<ComponentProps<"table">, "children"> &
  CellGridOptions & { children?: ReactNode };
type CellGridCellProps = Omit<ComponentProps<"td">, "id" | "children"> &
  GridCell & { id: string; children?: ReactNode };

const parts = createParts(cellGrid, { root: "table", cell: "td" }) as {
  Root: ComponentType<CellGridProps>;
  Cell: ComponentType<CellGridCellProps>;
};

/**
 * A table with one tab stop whose cells move by row and column with the arrow
 * keys. Cells that aren't `CellGridCell`s, like row headers, stay out of it.
 */
const CellGrid = parts.Root;
const CellGridCell = parts.Cell;

export type { GridCell };
export { CellGrid, CellGridCell };
