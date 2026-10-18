import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { Card, CardContent } from "@redshirt-sports/ui/components/card";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { Star } from "lucide-react";
import Link from "next/link";

/**
 * "Follow" call-to-action at the end of an article. Following is not wired
 * up yet, so the button routes to sign-in.
 */
export function FollowTeamCta({ name }: { name: string }) {
  return (
    <Card className="mt-8 py-0 shadow-xs">
      <CardContent className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold uppercase">
            Get {name} news
          </h2>
          <p className="text-muted-foreground text-sm">
            Follow for a personalized feed, newsletter and alerts.
          </p>
        </div>
        <Link href="/sign-in" prefetch={false} className={cn(buttonVariants())}>
          <Star aria-hidden />
          Follow {name}
        </Link>
      </CardContent>
    </Card>
  );
}
