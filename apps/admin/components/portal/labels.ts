import type { EventSourceType } from "@redshirt-sports/db/portal";

// Plain module (no "use client") so server pages can read these maps too.

export const EVENT_LABELS: Record<string, string> = {
  entered: "Entered the portal",
  offered: "Offer",
  committed: "Committed",
  decommitted: "Decommitted (back in the portal)",
  signed: "Signed",
  enrolled: "Enrolled",
  withdrew: "Withdrew from the portal",
};

export const STATUS_LABELS: Record<string, string> = {
  entered: "In portal",
  committed: "Committed",
  signed: "Signed",
  enrolled: "Enrolled",
  withdrawn: "Withdrew",
};

export const SOURCE_LABELS: Record<EventSourceType, string> = {
  social: "Social post",
  email: "Email",
  school: "School announcement",
  reporter: "Reporter",
  submission: "Submission",
  redshirt: "Our reporting",
};
