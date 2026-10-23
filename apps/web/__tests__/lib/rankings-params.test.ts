import { describe, expect, it, vi } from "vitest";

const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
);

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

import {
  resolveRankingsWeek,
  resolveRankingsYear,
} from "@/lib/rankings-params";

describe("resolveRankingsYear", () => {
  it("parses a four-digit year", () => {
    expect(resolveRankingsYear("2026")).toBe(2026);
  });

  it("calls notFound for invalid years", () => {
    expect(() => resolveRankingsYear("26")).toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});

describe("resolveRankingsWeek", () => {
  it("parses week segments", () => {
    expect(resolveRankingsWeek("7")).toBe(7);
    expect(resolveRankingsWeek("preseason")).toBe(0);
  });

  it("calls notFound for invalid weeks", () => {
    expect(() => resolveRankingsWeek("not-a-week")).toThrow("NOT_FOUND");
  });
});
