import type { AuthorsListNotArchivedResult } from "@redshirt-sports/sanity/types";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { Instagram, Twitter, YouTubeIcon } from "@/components/icons";
import CustomImage from "@/components/sanity-image";
import { SidebarCard } from "@/components/sidebar-card";

type Author = Omit<AuthorsListNotArchivedResult[number], "name" | "roles"> & {
  name: string;
  roles: readonly string[];
};

const SOCIALS: Array<{
  key: "twitter" | "youtube" | "instagram";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { key: "twitter", label: "X", Icon: Twitter },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "instagram", label: "Instagram", Icon: Instagram },
];

export function OurTeamCard({ authors }: { authors: Author[] }) {
  if (authors.length === 0) return null;

  return (
    <SidebarCard.Root labelledBy="our-team-heading">
      <SidebarCard.Header
        id="our-team-heading"
        title="Our team"
        action={
          <Link
            href="/about"
            className="text-primary text-sm font-semibold hover:underline hover:underline-offset-4"
          >
            About us
          </Link>
        }
      />
      <ul>
        {authors.map((author) => (
          <li
            key={author._id}
            className="hover:bg-muted flex items-center gap-3 border-t px-4 py-3 transition-colors"
          >
            <CustomImage
              image={author.image}
              width={44}
              height={44}
              mode="cover"
              className="size-11 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/authors/${author.slug}` as Route}
                className="hover:text-primary block truncate text-sm font-bold"
              >
                {author.name}
              </Link>
              {author.roles.length > 0 ? (
                <p className="text-muted-foreground truncate text-xs">
                  {author.roles.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {SOCIALS.map(({ key, label, Icon }) => {
                const href = author.socialLinks?.[key];
                if (!href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${author.name} on ${label}`}
                    className="bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-sm transition-colors"
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                  </a>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </SidebarCard.Root>
  );
}
