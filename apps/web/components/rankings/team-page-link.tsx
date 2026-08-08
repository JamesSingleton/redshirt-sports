import Link from "next/link";
import type { ReactNode } from "react";

export function TeamPageLink({
  slug,
  children,
  className,
}: {
  slug?: string | null;
  children: ReactNode;
  className?: string;
}) {
  if (!slug) {
    return children;
  }

  return (
    <Link
      href={`/college/teams/${slug}`}
      className={className ?? "hover:underline"}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
