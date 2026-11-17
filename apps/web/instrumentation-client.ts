import { initializeAnalytics } from "@redshirt-sports/analytics/instrumentation-client";
import { initializeSentry } from "@redshirt-sports/observability/client";
import { initBotId } from "botid/client/core";

initializeSentry();
initializeAnalytics();

// BotID attaches its proof to these requests; the server action checks it.
// The form posts to its own page (a Server Action), so that's the path.
initBotId({
  protect: [{ path: "/transfer-portal/submit", method: "POST" }],
});

export { onRouterTransitionStart } from "@redshirt-sports/observability/client";
