"use client";

import { AuthProvider } from "@redshirt-sports/auth/provider";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
