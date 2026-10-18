import Link from "next/link";
import type { ReactNode } from "react";

/** Headline link; falls back to plain text when a post has no slug. */
export function StoryTitleLink({
  href,
  className,
  children,
}: {
  href: string | null;
  className?: string;
  children: ReactNode;
}) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
