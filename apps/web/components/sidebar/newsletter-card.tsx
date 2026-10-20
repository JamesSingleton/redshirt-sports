import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { Input } from "@redshirt-sports/ui/components/input";
import { cn } from "@redshirt-sports/ui/lib/utils";

/**
 * Newsletter signup card. Presentational only for now: there is no signup
 * backend yet, so the controls are disabled rather than silently dropping
 * submissions.
 */
export function NewsletterCard({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-0 py-0 shadow-xs", className)}>
      <CardHeader className="gap-1 px-5 pt-5">
        <CardTitle>
          <h2 className="font-display text-xl leading-none font-bold tracking-wide uppercase">
            The Redshirt Daily
          </h2>
        </CardTitle>
        <CardDescription>
          One email, every weekday morning. Plus poll release alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pt-3 pb-5">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="you@example.com"
            aria-label="Email address"
            disabled
          />
          <Button type="button" disabled>
            Subscribe
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Newsletter signup is coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
