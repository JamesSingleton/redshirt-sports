import * as Sentry from "@sentry/nextjs";

/** Log a step that finished slower than this. */
const SLOW_MS = 3_000;
/**
 * Log a step that is still running at these marks. Vercel kills the function at
 * 15 s, so a step that never finishes would otherwise leave no trace at all.
 */
const STILL_WAITING_MS = [5_000, 10_000];

/**
 * Run one step of a page load inside a Sentry span, and log to the function logs
 * when it is slow or still pending. Quiet when the step is fast.
 */
export async function timedStep<T>(
  step: string,
  run: () => Promise<T>,
  log: Pick<Console, "warn"> = console,
): Promise<T> {
  const started = performance.now();
  const timers = STILL_WAITING_MS.map((ms) =>
    setTimeout(
      () => log.warn(`[slow-step] ${step}: still waiting after ${ms} ms`),
      ms,
    ),
  );
  try {
    return await Sentry.startSpan({ name: step, op: "admin.step" }, run);
  } finally {
    for (const timer of timers) clearTimeout(timer);
    const elapsed = Math.round(performance.now() - started);
    if (elapsed >= SLOW_MS) {
      log.warn(`[slow-step] ${step}: took ${elapsed} ms`);
    }
  }
}
