import { Stack } from "@sanity/ui";
import type { ComponentType } from "react";

import { PreflightLayout } from "./components/PreflightLayout";
import { SectionDivider } from "./components/SectionHeader";
import type { PreflightCheckProps, PreflightConfig } from "./types";

function PreflightBase({
  config,
  ...props
}: PreflightCheckProps & { config: PreflightConfig }) {
  return (
    <PreflightLayout>
      <Stack space={5}>
        {config.checks.map(
          (Check: ComponentType<PreflightCheckProps>, index: number) => (
            <Stack key={Check.displayName ?? Check.name ?? index} space={5}>
              <Check {...props} />
              {index < config.checks.length - 1 ? <SectionDivider /> : null}
            </Stack>
          ),
        )}
      </Stack>
    </PreflightLayout>
  );
}

export function Preflight(config: PreflightConfig): typeof PreflightBase {
  const Wrapped = (props: PreflightCheckProps) => (
    <PreflightBase {...props} config={config} />
  );
  Wrapped.displayName = "Preflight";
  return Wrapped;
}
