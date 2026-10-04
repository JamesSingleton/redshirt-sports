import type React from "react";

import type { BreadcrumbProps } from "@/types";
import BreadCrumbs from "./breadcrumbs";

type PageHeaderProps = {
  title: string;
  subtitle?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbProps;
  /** Rendered under the title, e.g. a filter row. */
  children?: React.ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  children,
}: PageHeaderProps) {
  return (
    <header className="container flex flex-col gap-4 pt-6 pb-6 md:pt-10">
      {breadcrumbs ? <BreadCrumbs breadCrumbPages={breadcrumbs} /> : null}
      <div className="flex max-w-3xl flex-col gap-2">
        <h1 className="headline text-4xl text-balance md:text-5xl">{title}</h1>
        {typeof subtitle === "string" ? (
          <p className="text-muted-foreground text-lg text-pretty">
            {subtitle}
          </p>
        ) : (
          subtitle
        )}
      </div>
      {children}
    </header>
  );
}
