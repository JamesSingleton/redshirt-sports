import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPush, mockRefresh, mockToast } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/actions/portal", () => ({
  pushPortalToSite: mockPush,
  findPortalSchools: vi.fn().mockResolvedValue([]),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));
vi.mock("sonner", () => ({ toast: mockToast }));

import {
  defaultCycleYear,
  localNow,
  localToIso,
  positionOptions,
  sourcePayload,
} from "@/components/portal/fields";
import { PortalPushBar } from "@/components/portal/push-bar";

describe("portal field helpers", () => {
  it("labels a cycle by the season the player would next play", () => {
    expect(defaultCycleYear(new Date(2026, 11, 1))).toBe(2027);
    expect(defaultCycleYear(new Date(2027, 0, 5))).toBe(2027);
    expect(defaultCycleYear(new Date(2027, 3, 15))).toBe(2027);
  });

  it("round-trips a local time to an instant", () => {
    const now = new Date(2027, 0, 2, 9, 30);
    expect(new Date(localToIso(localNow(now))).getTime()).toBe(now.getTime());
    expect(localToIso("garbage")).toBe("garbage");
  });

  it("lists positions per sport and blanks empty sources", () => {
    expect(positionOptions("football")[0]).toEqual({
      value: "QB",
      label: "QB · Quarterback",
    });
    expect(positionOptions(undefined)).toEqual([]);
    expect(
      sourcePayload({ sourceType: "", sourceUrl: "", sourceNote: "x" }),
    ).toEqual({ sourceType: null, sourceUrl: null, sourceNote: "x" });
  });
});

describe("PortalPushBar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is disabled with nothing pending", () => {
    render(
      <PortalPushBar
        pending={{ players: 0, changes: 0, oldestPendingSince: null }}
      />,
    );
    expect(
      screen.getByText(/Everything saved is on the site/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Push to site" })).toBeDisabled();
  });

  it("pushes and reports the result", async () => {
    mockPush.mockResolvedValueOnce({
      ok: true,
      message: "Published 2 players.",
    });
    render(
      <PortalPushBar
        pending={{
          players: 2,
          changes: 5,
          oldestPendingSince: new Date(Date.now() - 3 * 3_600_000),
        }}
      />,
    );
    expect(screen.getByText(/5 unpublished changes/)).toBeInTheDocument();
    expect(screen.getByText(/oldest 3 hr ago/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Push to site" }));
    expect(mockToast.success).toHaveBeenCalledWith("Published 2 players.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows a failed push", async () => {
    mockPush.mockResolvedValueOnce({ ok: false, message: "Push failed" });
    render(
      <PortalPushBar
        pending={{ players: 1, changes: 1, oldestPendingSince: new Date() }}
      />,
    );
    expect(screen.getByText(/for 1 player,/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Push to site" }));
    expect(mockToast.error).toHaveBeenCalledWith("Push failed");
  });
});
