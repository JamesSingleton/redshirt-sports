import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isTransferPortalEnabled } from "@/lib/transfer-portal";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PlayersLayout({ children }: { children: ReactNode }) {
  if (!isTransferPortalEnabled()) {
    notFound();
  }
  return children;
}
