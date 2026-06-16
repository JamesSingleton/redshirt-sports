import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: noIndexRobots,
};

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-400px)] flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-foreground animate-bounce text-6xl font-bold">404</h1>
      <p className="text-muted-foreground animate-fade-in text-lg">
        The page you are looking for does not exist.
      </p>
      <Link href="/" aria-label="Return Home" className={buttonVariants()}>
        Return Home
      </Link>
    </div>
  );
}
