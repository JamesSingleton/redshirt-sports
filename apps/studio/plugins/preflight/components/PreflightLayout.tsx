import { Box, Stack } from "@sanity/ui";
import type { ReactNode } from "react";

type PreflightLayoutProps = {
  children: ReactNode;
};

export function PreflightLayout({ children }: PreflightLayoutProps) {
  return (
    <Box padding={4}>
      <Stack space={5} style={{ maxWidth: "720px" }}>
        {children}
      </Stack>
    </Box>
  );
}
