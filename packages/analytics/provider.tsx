import PlausibleProvider from "next-plausible";
import type { ReactNode } from "react";

interface AnalyticsProviderProps {
  readonly children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => (
  <PlausibleProvider src="https://plausible.io/js/pa-UT66DP3cChsMGSbfVqOGV.js">
    {children}
  </PlausibleProvider>
);
