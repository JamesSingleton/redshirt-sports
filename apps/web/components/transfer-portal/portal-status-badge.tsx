import type { PortalStatus } from "@redshirt-sports/db/transfer-portal-constants";
import { Badge } from "@redshirt-sports/ui/components/badge";

import { PORTAL_STATUS_LABELS } from "@/lib/transfer-portal-format";

const STATUS_VARIANT = {
  ENTERED: "outline",
  COMMITTED: "default",
  SIGNED: "default",
  ENROLLED: "secondary",
  WITHDRAWN: "secondary",
} as const satisfies Record<PortalStatus, "default" | "secondary" | "outline">;

export function PortalStatusBadge({ status }: { status: PortalStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {PORTAL_STATUS_LABELS[status]}
    </Badge>
  );
}
