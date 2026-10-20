import { buttonVariants } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import Link from "next/link";

import CustomImage from "@/components/sanity-image";
import type { Movement } from "@/lib/rankings-movement";

export type RankingsCardTeam = {
  id: string;
  rank: number;
  isTie?: boolean;
  name: string;
  abbreviation?: string | null;
  slug?: string | null;
  image?: unknown;
  movement?: Movement | null;
};

function TeamLogo({
  team,
  className,
}: {
  team: RankingsCardTeam;
  className: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-muted-foreground/40",
        className,
      )}
    >
      <span className="font-display text-[0.62em] font-bold tracking-wide">
        {(team.abbreviation ?? team.name).slice(0, 4).toUpperCase()}
      </span>
      {team.image ? (
        <CustomImage
          image={team.image as Parameters<typeof CustomImage>[0]["image"]}
          alt=""
          width={56}
          height={56}
          className="bg-card absolute inset-0 size-full object-contain"
          mode="contain"
        />
      ) : null}
    </span>
  );
}

function MovementBadge({ movement }: { movement?: Movement | null }) {
  if (!movement) {
    return null;
  }

  switch (movement.kind) {
    case "up":
      return (
        <span
          className="text-up tabular inline-flex items-center gap-0.5 text-xs font-bold"
          aria-label={`Up ${movement.delta}`}
        >
          <ChevronUp className="size-3.5" aria-hidden />
          {movement.delta}
        </span>
      );
    case "down":
      return (
        <span
          className="text-down tabular inline-flex items-center gap-0.5 text-xs font-bold"
          aria-label={`Down ${movement.delta}`}
        >
          <ChevronDown className="size-3.5" aria-hidden />
          {movement.delta}
        </span>
      );
    case "same":
      return (
        <span
          className="text-muted-foreground inline-flex items-center"
          aria-label="No change"
        >
          <Minus className="size-3.5" aria-hidden />
        </span>
      );
    case "nr":
      return (
        <span
          className="text-muted-foreground text-[10px] font-bold tracking-wide"
          aria-label="New to rankings"
        >
          NR
        </span>
      );
  }
}

function TeamName({ team }: { team: RankingsCardTeam }) {
  const label = (
    <span className="truncate text-sm font-semibold">{team.name}</span>
  );
  if (!team.slug) return label;
  return (
    <Link
      href={`/college/teams/${team.slug}`}
      prefetch={false}
      className="min-w-0 hover:underline"
    >
      {label}
    </Link>
  );
}

/** Compact poll card (home, article and news sidebars). */
export function RankingsCard({
  title,
  description,
  teams,
  fullPollHref,
  headingLevel = "h2",
  className,
}: {
  title: string;
  description?: string;
  teams: RankingsCardTeam[];
  fullPollHref: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;

  return (
    <Card className={cn("gap-0 py-0 shadow-xs", className)}>
      <CardHeader className="flex items-start justify-between gap-2 px-5 pt-5">
        <div className="grid gap-1">
          <CardTitle>
            <Heading className="font-display text-xl leading-none font-bold tracking-wide uppercase">
              {title}
            </Heading>
          </CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-2">
        <ol className="divide-y">
          {teams.map((team) => (
            <li key={team.id} className="flex items-center gap-3 py-2">
              <span className="font-display tabular w-6 text-right text-lg font-bold">
                {team.isTie ? `T${team.rank}` : team.rank}
              </span>
              <TeamLogo team={team} className="size-7" />
              <div className="flex min-w-0 flex-1">
                <TeamName team={team} />
              </div>
              <span className="w-9 text-right">
                <MovementBadge movement={team.movement} />
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="px-5 pt-3 pb-5">
        <Link
          href={fullPollHref}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full",
          )}
        >
          Full poll
        </Link>
      </CardFooter>
    </Card>
  );
}
