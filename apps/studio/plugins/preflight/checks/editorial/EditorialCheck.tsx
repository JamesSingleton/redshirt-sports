import { Stack } from "@sanity/ui";
import { useMemo } from "react";

import { SectionHeader } from "../../components/SectionHeader";
import { StatusRow } from "../../components/StatusRow";
import type { PreflightCheckProps } from "../../types";
import { getEditorialBadge, runEditorialRules } from "./rules";

function EditorialCheckBase({ document }: PreflightCheckProps) {
  const displayed = document?.displayed ?? {};
  const results = useMemo(() => runEditorialRules(displayed), [displayed]);
  const badge = getEditorialBadge(results);

  return (
    <Stack space={4}>
      <SectionHeader
        badge={badge}
        description="Editorial and SEO checks based on this article's fields and body content."
        title="Editorial"
      />

      <Stack space={2}>
        {results.map((result) => (
          <StatusRow
            key={result.id}
            primary={result.label}
            secondary={result.message ?? result.detail}
            status={result.status}
          />
        ))}
      </Stack>
    </Stack>
  );
}

export function EditorialCheck(): typeof EditorialCheckBase {
  const Wrapped = (props: PreflightCheckProps) => (
    <EditorialCheckBase {...props} />
  );
  Wrapped.displayName = "EditorialCheck";
  return Wrapped;
}
