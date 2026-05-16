import { cn } from "@redshirt-sports/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "VIEW ALL",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
          prefetch={false}
        >
          {viewAllLabel}
          <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
