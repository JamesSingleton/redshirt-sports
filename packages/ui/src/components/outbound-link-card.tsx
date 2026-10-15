import { Button } from "@redshirt-sports/ui/components/button";

export function OutboundLinkCard({
  href,
  title,
  host,
}: {
  href: string;
  title: string;
  host: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 text-card-foreground">
      <h3 className="font-display text-headline-sm font-bold">{title}</h3>
      <p className="mt-1 text-muted-foreground text-sm">Opens on {host}</p>
      <Button asChild variant="outline" className="mt-3">
        <a href={href} rel="noreferrer noopener" target="_blank">
          Continue
        </a>
      </Button>
    </article>
  );
}
