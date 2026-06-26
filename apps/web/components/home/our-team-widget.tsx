import type { QueryHomepageTeamAuthorsResult } from "@redshirt-sports/sanity/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";

import { Twitter, YouTubeIcon } from "@/components/icons";
import CustomImage from "@/components/sanity-image";

function formatRole(roles: QueryHomepageTeamAuthorsResult[number]["roles"]) {
  return roles?.[0] ?? "Contributor";
}

interface OurTeamWidgetProps {
  authors: QueryHomepageTeamAuthorsResult;
}

export function OurTeamWidget({ authors }: OurTeamWidgetProps) {
  if (authors.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base leading-none font-black tracking-tight text-foreground uppercase">
          Our Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          {authors.map((member) => (
            <li
              key={member._id}
              className="flex items-center gap-3 border-border border-t px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <Link
                href={`/authors/${member.slug}`}
                prefetch={false}
                className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted"
              >
                <CustomImage
                  image={member.image}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                  mode="cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/authors/${member.slug}`}
                  prefetch={false}
                  className="text-sm leading-tight font-bold text-foreground hover:text-primary"
                >
                  {member.name}
                </Link>
                <p className="truncate text-[11px] text-muted-foreground">
                  {formatRole(member.roles)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {member.socialLinks?.twitter ? (
                  <a
                    href={member.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on X`}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
                  >
                    <Twitter className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                ) : null}
                {member.socialLinks?.youtube ? (
                  <a
                    href={member.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on YouTube`}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-muted transition-colors hover:bg-muted/80"
                  >
                    <YouTubeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
