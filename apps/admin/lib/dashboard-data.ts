import { getAdminDashboardSnapshot } from "@redshirt-sports/db/queries";

import {
  buildDashboardData,
  type DashboardData,
} from "@/lib/build-dashboard-data";
import { requireAdmin } from "@/lib/require-admin";

export type { DashboardData, DashboardPanel } from "@/lib/build-dashboard-data";
export { buildDashboardData } from "@/lib/build-dashboard-data";

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  const snapshot = await getAdminDashboardSnapshot();
  return buildDashboardData(snapshot);
}
