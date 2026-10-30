import type { SchoolBySlugQueryResult } from "@redshirt-sports/sanity/types";
import { ExternalLink, Star, User } from "lucide-react";

import { socialHandle } from "@/components/teams/team-connect-widget";
import {
  buildTeamInfoAthleticsLink,
  buildTeamInfoFactRows,
  buildTeamSocialLinks,
  type TeamConferenceAffiliationInput,
  type TeamInfoAthleticsLink,
} from "@/lib/team-school-affiliations";

function AthleticsLinkCard({ card }: { card: TeamInfoAthleticsLink }) {
  return (
    <a
      href={card.href}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      rel="noopener noreferrer"
      target="_blank"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground"
        aria-hidden
      >
        <Star className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{card.title}</span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {card.subtitle}
        </span>
      </span>
      <ExternalLink
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

function SocialLinksCard({
  links,
}: {
  links: ReturnType<typeof buildTeamSocialLinks>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground"
          aria-hidden
        >
          <User className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">Social</div>
          <ul className="mt-2 flex flex-col gap-2">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  className="group flex items-center justify-between gap-3 text-sm"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>
                    <span className="font-medium text-foreground group-hover:underline">
                      {link.label}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {socialHandle(link.href)}
                    </span>
                  </span>
                  <ExternalLink
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TeamInfoLinks({
  school,
}: {
  school: NonNullable<SchoolBySlugQueryResult>;
}) {
  const affiliations = (school.conferenceAffiliations ?? null) as
    | TeamConferenceAffiliationInput[]
    | null;

  const factRows = buildTeamInfoFactRows(
    { name: school.name, nickname: school.nickname },
    affiliations,
  );
  const athleticsLink = buildTeamInfoAthleticsLink(school.websiteUrl);
  const socialLinks = buildTeamSocialLinks(school.socialLinks);
  const hasOutboundLinks = athleticsLink != null || socialLinks.length > 0;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <dl>
          {factRows.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-baseline justify-between gap-6 py-3 text-sm ${
                index < factRows.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <dt className="w-28 shrink-0 text-muted-foreground">
                {row.label}
              </dt>
              <dd className="min-w-0 flex-1 text-right font-medium leading-snug">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {hasOutboundLinks ? (
        <div className="grid content-start gap-3">
          {athleticsLink ? <AthleticsLinkCard card={athleticsLink} /> : null}
          {socialLinks.length > 0 ? (
            <SocialLinksCard links={socialLinks} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
