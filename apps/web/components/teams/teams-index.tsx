"use client";

import type { QueryTeamsIndexSchoolsResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import Link from "next/link";

import { SectionHeader } from "@/components/home/section-header";
import CustomImage from "@/components/sanity-image";

interface TeamsIndexProps {
  schools: QueryTeamsIndexSchoolsResult;
}

export function TeamsIndex({ schools }: TeamsIndexProps) {
  return (
    <div className="container grid grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:py-6">
      <div className="min-w-0">
        <SectionHeader title="College Teams" headingLevel="h1" />

        <p className="mb-3 text-xs text-muted-foreground">
          {schools.length} {schools.length === 1 ? "team" : "teams"}
        </p>

        {schools.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No teams found.
          </div>
        ) : (
          <div className="flex flex-col">
            {schools.map((school) => (
              <div
                key={school._id}
                className="flex items-center justify-between border-border border-b py-3"
              >
                <Link
                  href={`/college/teams/${school.slug}`}
                  prefetch={false}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <CustomImage
                      image={school.image}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      mode="contain"
                    />
                  </div>
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {school.shortName ?? school.name}
                    </span>
                    {school.nickname ? (
                      <span className="truncate text-xs tracking-wide text-muted-foreground uppercase">
                        {school.nickname}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="flex shrink-0 items-center">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-xs uppercase"
                  >
                    <Link
                      href={`/college/teams/${school.slug}`}
                      prefetch={false}
                    >
                      Hub
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div
          className="flex h-[250px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
          aria-hidden="true"
        >
          Advertisement
        </div>
        <div
          className="mt-6 flex h-[250px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground"
          aria-hidden="true"
        >
          Advertisement
        </div>
      </aside>
    </div>
  );
}
