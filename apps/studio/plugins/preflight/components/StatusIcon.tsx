import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { CloseCircleIcon } from "@sanity/icons/CloseCircle";
import { EllipsisHorizontalIcon } from "@sanity/icons/EllipsisHorizontal";
import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { Spinner } from "@sanity/ui";

import type { CheckStatus } from "../types";

type StatusIconProps = {
  status: CheckStatus;
};

export function StatusIcon({ status }: StatusIconProps) {
  switch (status) {
    case "checking":
      return <Spinner muted />;
    case "success":
      return (
        <CheckmarkCircleIcon
          style={{ color: "var(--card-badge-positive-fg-color)" }}
        />
      );
    case "warning":
      return (
        <WarningOutlineIcon
          style={{ color: "var(--card-badge-caution-fg-color)" }}
        />
      );
    case "error":
      return (
        <CloseCircleIcon
          style={{ color: "var(--card-badge-critical-fg-color)" }}
        />
      );
    default:
      return (
        <EllipsisHorizontalIcon
          style={{ color: "var(--card-muted-fg-color)" }}
        />
      );
  }
}
