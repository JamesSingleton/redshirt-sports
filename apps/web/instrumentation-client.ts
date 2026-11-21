import { initializeAnalytics } from "@redshirt-sports/analytics/instrumentation-client";
import { initializeSentry } from "@redshirt-sports/observability/client";
import { initBotId } from "botid/client/core";

initializeSentry();
initializeAnalytics();

// BotID attaches its proof to these requests; the server checks it.
// The portal form posts to its own page (a Server Action), so that's the path.
initBotId({
  protect: [
    { path: "/transfer-portal/submit", method: "POST" },
    { path: "/api/newsletter/subscribe", method: "POST" },
  ],
});

export { onRouterTransitionStart } from "@redshirt-sports/observability/client";
