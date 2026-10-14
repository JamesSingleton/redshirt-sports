import "@redshirt-sports/ui/globals.css";
import type { Metadata } from "next";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Redshirt Sports Voting",
  description: "Credentialed-voter ballots for Redshirt Sports",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
