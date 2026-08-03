"use client";

import { Toaster } from "@redshirt-sports/ui/components/sonner";
import { ThemeProvider } from "next-themes";
import type { ComponentProps, ReactNode } from "react";

type ThemesProviderProps = ComponentProps<typeof ThemeProvider> & {
  children: ReactNode;
};

function ThemesProvider({ children, ...props }: ThemesProviderProps) {
  return <ThemeProvider {...props}>{children}</ThemeProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
      <Toaster />
    </ThemesProvider>
  );
}
