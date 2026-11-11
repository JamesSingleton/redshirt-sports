import type { DocumentBadgeComponent } from "sanity";

import { checkStory, type PostLike } from "@/house-rules/post";
import { groupFindings } from "@/house-rules/types";

/**
 * Header badge with the Article check result, so an editor sees "3 to fix"
 * without opening the check pane. Counts distinct problems, as the pane does.
 */
export const ArticleCheckBadge: DocumentBadgeComponent = (props) => {
  const doc = (props.version ??
    props.draft ??
    props.published) as PostLike | null;
  if (!doc) return null;

  const findings = checkStory(doc).sections.flatMap((section) =>
    groupFindings(section.findings),
  );
  const errors = findings.filter((finding) => finding.level === "error").length;

  return errors > 0
    ? {
        label: `${errors} to fix`,
        title: "Open the Article check tab to see what's blocking publishing",
        color: "danger",
      }
    : {
        label: "Ready",
        title: "Passes the house rules",
        color: "success",
      };
};
