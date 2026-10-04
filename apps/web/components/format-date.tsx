"use client";

import { useSyncExternalStore } from "react";

import type { WithClassName } from "@/types";
import {
  formatAbsoluteDate,
  formatPublishedDate,
} from "@/utils/format-published-date";

interface DateProps extends WithClassName {
  dateString: string;
}

const MINUTE_MS = 60_000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    for (const notify of listeners) notify();
  }, MINUTE_MS);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getCurrentMinute() {
  return Math.floor(Date.now() / MINUTE_MS);
}

/**
 * Pages that render this are cached, so the server always renders the
 * absolute date and the relative label only appears once the client knows
 * the current time.
 */
function getServerMinute() {
  return null;
}

export default function FormatDate({ dateString, className }: DateProps) {
  const minute = useSyncExternalStore(
    subscribe,
    getCurrentMinute,
    getServerMinute,
  );
  const date = new Date(dateString);
  const absolute = formatAbsoluteDate(date);
  const label =
    minute === null ? absolute : formatPublishedDate(date, minute * MINUTE_MS);

  return (
    <time
      dateTime={dateString}
      className={className}
      title={label === absolute ? undefined : absolute}
    >
      {label}
    </time>
  );
}
