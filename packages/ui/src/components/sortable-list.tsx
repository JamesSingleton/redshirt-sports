"use client";

import {
  type ChangeDetails,
  createChange,
  createReorder,
  definePrimitive,
  type ReorderDraft,
  type ReorderMessage,
  type ReorderReason,
  reorderMessage,
} from "@ui-sdk/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ComponentType, ReactNode } from "react";

type SortableListOptions = {
  /** The item keys, in order. */
  value?: string[];
  defaultValue?: string[];
  /** Runs when a drag, a key or a move button asks for a new order. */
  onValueChange?: (
    value: string[],
    details: ChangeDetails<ReorderReason>,
  ) => void;
  /** Keys that can't be picked up, like an empty slot. They still move aside. */
  isDisabled?: (key: string) => boolean;
  /** The name screen readers hear for an item. Defaults to its text. */
  label?: (key: string) => string | undefined;
  /** The text screen readers hear for each step. Defaults to English. */
  message?: (message: ReorderMessage) => string;
};

type SortableListState = {
  value: string[];
  moving: ReorderDraft | null;
};

const itemValue = { kind: "string", from: "item" } as const;

const sortableList = definePrimitive({
  name: "sortable-list",
  options: {
    value: "list",
    defaultValue: "list",
    onValueChange: "callback",
    isDisabled: "callback",
    label: "callback",
    message: "callback",
  },
  state: (options: SortableListOptions): SortableListState => ({
    value: options.value ?? options.defaultValue ?? [],
    moving: null,
  }),
  sync: (options) =>
    options.value === undefined ? {} : { value: options.value },
  api: (context) => {
    const change = createChange(context);
    const reorder = createReorder(context, {
      slot: "item",
      key: "value",
      draft: "moving",
      set: (value, details) => change("value", value, details),
      disabled: ({ key }) => !!context.options().isDisabled?.(key),
      label: (key) => context.options().label?.(key),
      message: (message) =>
        (context.options().message ?? reorderMessage)(message),
    });
    const order = () => reorder.order(context.store.get());
    return {
      reorder,
      /** Moves an item one place up (-1) or down (1), if it can go there. */
      step(key: string, by: -1 | 1) {
        const index = order().indexOf(key) + by;
        if (index < 0 || index >= order().length) return false;
        return reorder.move(key, index);
      },
      /** Whether an item is first (-1) or last (1), so it can't step that way. */
      atEdge(state: SortableListState, key: string, by: -1 | 1) {
        const current = reorder.order(state);
        return current.indexOf(key) === (by < 0 ? 0 : current.length - 1);
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      state: (state, { api }) => ({ order: api.reorder.order(state) }),
    }),
    item: slot<{ value: string }>({
      props: { value: "string" },
      attrs: (state, { api, key }) => ({
        "data-grabbed": state.moving?.key === key ? "" : undefined,
        "data-dragging": api.reorder.dragging(state, key) ? "" : undefined,
      }),
      on: {
        // Alt+Up and Alt+Down move the row from any control inside it.
        keydown: (event, { el, api, key }) => {
          const { altKey, key: pressed, target } = event as KeyboardEvent;
          if (!altKey || !el?.contains(target as Node)) return;
          if (pressed !== "ArrowUp" && pressed !== "ArrowDown") return;
          event.preventDefault();
          api.step(key, pressed === "ArrowUp" ? -1 : 1);
        },
      },
      bind: (el, part) => part.api.reorder.bind(el, part),
    }),
    handle: slot<{ value: string }>({
      props: { value: itemValue },
      role: "button",
      focus: "native",
      press: { none: "Space and Enter pick it up in keydown." },
      attrs: (state, { key }) => ({
        type: "button",
        "aria-pressed": String(state.moving?.key === key),
      }),
      on: {
        keydown: (event, { api, key }) => {
          api.reorder.keydown(event as KeyboardEvent, key);
        },
        pointerdown: (event, { api, key }) =>
          api.reorder.pointerdown(event as PointerEvent, key),
      },
    }),
    up: slot<{ value: string }>({
      props: { value: itemValue },
      role: "button",
      focus: "native",
      attrs: (state, { api, key }) => ({
        type: "button",
        // aria-disabled keeps focus on the button once it reaches the end.
        "aria-disabled": api.atEdge(state, key, -1) ? "true" : undefined,
      }),
      press: ({ api, key }) => api.step(key, -1),
    }),
    down: slot<{ value: string }>({
      props: { value: itemValue },
      role: "button",
      focus: "native",
      attrs: (state, { api, key }) => ({
        type: "button",
        // aria-disabled keeps focus on the button once it reaches the end.
        "aria-disabled": api.atEdge(state, key, 1) ? "true" : undefined,
      }),
      press: ({ api, key }) => api.step(key, 1),
    }),
  }),
});

// Spelled out because the inferred part types name a type ui-sdk doesn't
// export, which this package's declaration build can't emit.
type SortableListProps = Omit<
  ComponentProps<"ol">,
  "children" | "defaultValue"
> &
  SortableListOptions & {
    /** Render the items in `order`, which follows a drag as it happens. */
    children: (state: { order: string[] }) => ReactNode;
  };
type SortableListItemProps = Omit<ComponentProps<"li">, "value"> & {
  value: string;
};
type SortableListButtonProps = Omit<ComponentProps<"button">, "value"> & {
  value?: string;
};

const parts = createParts(sortableList, {
  root: "ol",
  item: "li",
  handle: "button",
  up: "button",
  down: "button",
}) as {
  Root: ComponentType<SortableListProps>;
  Item: ComponentType<SortableListItemProps>;
  Handle: ComponentType<SortableListButtonProps>;
  Up: ComponentType<SortableListButtonProps>;
  Down: ComponentType<SortableListButtonProps>;
};

/**
 * An ordered list whose items move by dragging a handle, by pressing Space on
 * the handle and then the arrows, with Alt+Up and Alt+Down from anywhere in an
 * item, or with its up and down buttons. Render the items from `order`.
 */
const SortableList = parts.Root;
const SortableListItem = parts.Item;
/** Drag it, or press Space and the arrows. Give it an `aria-label`. */
const SortableListHandle = parts.Handle;
/** Moves its item up one place. Give it an `aria-label`. */
const SortableListUp = parts.Up;
/** Moves its item down one place. Give it an `aria-label`. */
const SortableListDown = parts.Down;

export type { ReorderMessage };
export {
  reorderMessage,
  SortableList,
  SortableListDown,
  SortableListHandle,
  SortableListItem,
  SortableListUp,
};
