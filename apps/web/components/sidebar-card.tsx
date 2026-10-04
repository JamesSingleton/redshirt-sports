import { cn } from "@redshirt-sports/ui/lib/utils";
import type { ReactNode } from "react";

function SidebarCardRoot({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "bg-card text-card-foreground overflow-hidden rounded-md border",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SidebarCardHeader({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-brand flex flex-col gap-3 border-l-4 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="headline text-xl leading-none">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export const SidebarCard = {
  Root: SidebarCardRoot,
  Header: SidebarCardHeader,
};
