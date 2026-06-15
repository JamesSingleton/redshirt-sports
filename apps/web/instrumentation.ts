import { initializeSentry } from "@redshirt-sports/observability/instrumentation";

export const register = initializeSentry;
export { onRequestError } from "@redshirt-sports/observability/instrumentation";
