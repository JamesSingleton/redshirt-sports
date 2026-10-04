import { initializeSentry } from "@redshirt-sports/observability/instrumentation";

export const register = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Error.stackTraceLimit = 80;
    const fs = await import("node:fs");
    process.on("unhandledRejection", (reason) => {
      const stack = reason instanceof Error ? reason.stack : String(reason);
      fs.appendFileSync("/tmp/rs-unhandled.log", `\n=====\n${stack}\n`);
    });
  }
  return initializeSentry();
};
export { onRequestError } from "@redshirt-sports/observability/instrumentation";
