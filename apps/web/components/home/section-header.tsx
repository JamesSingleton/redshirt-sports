import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  badge?: string;
  className?: string;
  id?: string;
  headingLevel?: "h1" | "h2";
}

export function SectionHeader({
  title,
  href,
  badge,
  className,
  id,
  headingLevel = "h2",
}: SectionHeaderProps) {
  const Heading = headingLevel;

  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between border-primary border-b-2 pb-2",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Heading id={id} className="text-lg font-bold text-foreground">
          {title}
        </Heading>
        {badge ? (
          <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          prefetch={false}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
