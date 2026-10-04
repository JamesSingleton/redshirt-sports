import { buttonVariants } from "@redshirt-sports/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@redshirt-sports/ui/components/empty";
import type { Metadata } from "next";
import Link from "next/link";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: noIndexRobots,
};

export default function NotFound() {
  return (
    <div className="container py-12 md:py-20">
      <Empty className="border">
        <EmptyHeader>
          <p className="rank-numeral text-brand text-6xl">404</p>
          <EmptyTitle className="headline text-2xl">
            <h1>Page not found</h1>
          </EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist or has moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Link href="/" className={buttonVariants()}>
            Return home
          </Link>
          <Link
            href="/college/news"
            className={buttonVariants({ variant: "outline" })}
          >
            Latest news
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
}
