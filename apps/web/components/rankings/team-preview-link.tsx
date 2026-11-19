"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@redshirt-sports/ui/components/hover-card";
import Link from "next/link";
import type { ReactNode } from "react";

import { TeamMark } from "@/components/rankings/team-mark";
import { NAV_FORWARD_TRANSITION } from "@/lib/view-transition-nav";

/**
 * A link to the team's page that previews the team's week on hover or focus.
 * Everything in the preview is on the page the link goes to, so touch users
 * who never see it lose nothing.
 */
export function TeamPreviewLink({
  slug,
  team,
  heading,
  details,
  className,
  children,
}: {
  slug: string;
  team: {
    name: string;
    shortName: string;
    abbreviation?: string | null;
    image?: Parameters<typeof TeamMark>[0]["image"];
  };
  heading: string;
  details: string[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <HoverCard delay={400}>
      <HoverCardTrigger
        render={
          <Link
            href={`/college/teams/${slug}`}
            prefetch={false}
            transitionTypes={[...NAV_FORWARD_TRANSITION]}
          />
        }
        className={className}
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-center gap-3">
          <TeamMark
            image={team.image ?? null}
            shortName={team.shortName}
            abbreviation={team.abbreviation}
            name={team.name}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight font-bold">
              {team.name}
            </p>
            <p className="text-sm text-muted-foreground">{heading}</p>
          </div>
        </div>
        <ul className="mt-3 grid gap-1 border-t pt-3 text-sm">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
