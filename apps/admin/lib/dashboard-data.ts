import {
  getAdminDashboardSnapshot,
  listAutoPublishSchedule,
} from "@redshirt-sports/db/queries";

import {
  buildDashboardData,
  type DashboardData,
} from "@/lib/build-dashboard-data";
import { requireAdmin } from "@/lib/require-admin";
import { timedStep } from "@/lib/slow-steps";

export type { DashboardData, DashboardPanel } from "@/lib/build-dashboard-data";
export { buildDashboardData } from "@/lib/build-dashboard-data";

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  const [snapshot, autoPublish] = await Promise.all([
    timedStep("home: dashboard snapshot", () => getAdminDashboardSnapshot()),
    timedStep("home: auto-publish schedule", () => listAutoPublishSchedule()),
  ]);
  return buildDashboardData(snapshot, autoPublish);
}
