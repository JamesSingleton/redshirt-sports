import { IconAlertTriangle } from "@tabler/icons-react";

import type { AutoPublishLabel } from "@/lib/auto-publish-label";

/** The next Monday run for a poll; a warning when it would skip the week. */
export function AutoPublishNote({
  label,
  className = "",
}: {
  label: AutoPublishLabel;
  className?: string;
}) {
  if (label.tone === "warning") {
    return (
      <span
        role="status"
        className={`flex items-start gap-1 text-xs font-medium text-destructive ${className}`}
      >
        <IconAlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
        {label.text}
      </span>
    );
  }
  return (
    <span
      className={`text-xs ${label.tone === "scheduled" ? "font-medium" : "text-muted-foreground"} ${className}`}
    >
      {label.text}
    </span>
  );
}
