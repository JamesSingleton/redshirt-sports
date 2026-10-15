import { Button } from "@redshirt-sports/ui/components/button";
import { cn } from "@redshirt-sports/ui/lib/utils";

export type SiteHeaderLink = {
  href: string;
  label: string;
};

export function SiteHeader({
  links,
  className,
}: {
  links: SiteHeaderLink[];
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4 lg:h-16",
        className,
      )}
    >
      <a href="/" className="font-display text-xl font-bold tracking-tight">
        Redshirt Sports
      </a>
      <nav aria-label="Primary" className="hidden items-center gap-4 md:flex">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="text-sm font-medium">
            {link.label}
          </a>
        ))}
      </nav>
      <Button variant="ink" size="sm" asChild>
        <a href="/sign-in">Sign in</a>
      </Button>
    </header>
  );
}
