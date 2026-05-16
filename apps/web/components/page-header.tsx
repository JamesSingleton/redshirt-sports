import { cn } from "@redshirt-sports/ui/lib/utils";
import type React from "react";

import type { BreadcrumbProps } from "@/types";
import BreadCrumbs from "./breadcrumbs";
import { DivisionBadge, type DivisionSlug } from "./division-badge";

type PageHeaderProps = {
  title: string;
  subtitle?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbProps;
  variant?: "default" | "dark";
  division?: DivisionSlug | string;
};

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  variant = "default",
  division,
}: PageHeaderProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "py-10 md:py-12",
        isDark && "bg-black border-b-2 border-primary"
      )}
    >
      <div className="container">
        <div className="md:max-w-3xl xl:max-w-5xl">
          {breadcrumbs && (
            <BreadCrumbs
              breadCrumbPages={breadcrumbs}
              className={isDark ? "text-white/70" : undefined}
            />
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {division && <DivisionBadge division={division} size="md" />}
            <h1
              className={cn(
                "text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl",
                isDark && "text-white"
              )}
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <div className={cn("mt-4", isDark && "text-white/70")}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
