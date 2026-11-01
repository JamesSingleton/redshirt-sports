import { NavigationMenuLink } from "@redshirt-sports/ui/components/navigation-menu";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

/** shadcn NavigationMenu list row: a title with an optional one-line description. */
export function NavListItem({
  href,
  title,
  children,
  openInNewTab = false,
  className,
}: {
  href: string;
  title: ReactNode;
  children?: ReactNode;
  openInNewTab?: boolean | null;
  className?: string;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          prefetch={false}
          className={cn("block", className)}
          {...(openInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          {children ? (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          ) : null}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

/** Small uppercase section heading inside a dropdown. */
export function NavSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="kicker px-2 pt-1 pb-1.5 text-muted-foreground">
      {children}
    </div>
  );
}
