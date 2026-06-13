import { initializeAnalytics } from "@redshirt-sports/analytics/instrumentation-client";
import { initializeSentry } from "@redshirt-sports/observability/client";

initializeSentry();
initializeAnalytics();

export { onRouterTransitionStart } from "@redshirt-sports/observability/client";
