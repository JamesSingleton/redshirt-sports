import {
  getAdminDashboardSnapshot,
  listAutoPublishSchedule,
} from "@redshirt-sports/db/queries";

import { requireArea } from "@/lib/access";
import {
  buildDashboardData,
  type DashboardData,
} from "@/lib/build-dashboard-data";
import { timedStep } from "@/lib/slow-steps";

export type { DashboardData, DashboardPanel } from "@/lib/build-dashboard-data";
export { buildDashboardData } from "@/lib/build-dashboard-data";

export async function getDashboardData(): Promise<DashboardData> {
  await requireArea("admin");
  const [snapshot, autoPublish] = await Promise.all([
    timedStep("home: dashboard snapshot", () => getAdminDashboardSnapshot()),
    timedStep("home: auto-publish schedule", () => listAutoPublishSchedule()),
  ]);
  return buildDashboardData(snapshot, autoPublish);
}
