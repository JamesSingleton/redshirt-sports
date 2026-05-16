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
    <div className={cn("flex items-center justify-between mb-8 border-b border-border pb-4", className)}>
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-primary" />
        <h2 className="text-lg font-extrabold uppercase tracking-wider text-foreground">
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          prefetch={false}
        >
          {viewAllLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
