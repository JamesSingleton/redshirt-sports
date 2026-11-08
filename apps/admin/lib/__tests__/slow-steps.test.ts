import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { startSpan } = vi.hoisted(() => ({
  startSpan: vi.fn((_options: unknown, run: () => unknown) => run()),
}));

vi.mock("@sentry/nextjs", () => ({ startSpan }));

import { timedStep } from "@/lib/slow-steps";

describe("timedStep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startSpan.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is quiet for a fast step and traces it as a span", async () => {
    const log = { warn: vi.fn() };
    await expect(timedStep("fast", async () => 42, log)).resolves.toBe(42);
    expect(log.warn).not.toHaveBeenCalled();
    expect(startSpan).toHaveBeenCalledWith(
      { name: "fast", op: "admin.step" },
      expect.any(Function),
    );
  });

  it("logs a step that is still pending, then how long it took", async () => {
    const log = { warn: vi.fn() };
    let finish: (value: string) => void = () => {};
    const pending = timedStep(
      "home: data",
      () => new Promise<string>((resolve) => (finish = resolve)),
      log,
    );

    await vi.advanceTimersByTimeAsync(10_000);
    expect(log.warn.mock.calls.map(([line]) => line)).toEqual([
      "[slow-step] home: data: still waiting after 5000 ms",
      "[slow-step] home: data: still waiting after 10000 ms",
    ]);

    finish("done");
    await expect(pending).resolves.toBe("done");
    expect(log.warn).toHaveBeenLastCalledWith(
      expect.stringMatching(/^\[slow-step\] home: data: took \d+ ms$/),
    );
  });

  it("stops its timers and still reports when the step fails", async () => {
    const log = { warn: vi.fn() };
    const failing = timedStep(
      "auth: protect",
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("nope")), 4_000),
        ),
      log,
    );
    const settled = expect(failing).rejects.toThrow("nope");
    await vi.advanceTimersByTimeAsync(4_000);
    await settled;
    expect(log.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^\[slow-step\] auth: protect: took \d+ ms$/),
    );
    await vi.advanceTimersByTimeAsync(10_000);
    expect(log.warn).toHaveBeenCalledTimes(1);
  });
});
