import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import Link from "next/link";

import { draftAwarePage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { fetchAllSports } from "@/lib/sport-by-slug";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = await getDynamicFetchOptions();

  return getPageMetadata(
    {
      title: "Recruiting",
      description:
        "College recruiting rankings, commitments, news, and player profiles by sport.",
      slug: "/recruiting",
    },
    perspective,
  );
}

export default async function RecruitingIndexPage() {
  return draftAwarePage(null, renderRecruitingIndexPage);
}

async function renderRecruitingIndexPage({ perspective }: DynamicFetchOptions) {
  "use cache";
  const sports = await fetchAllSports(perspective);

  return (
    <div className="container max-w-5xl px-4 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">
          Recruiting
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Recruiting Hub
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Rankings, commitments, news, and player search by sport.
        </p>
        <div className="mt-4">
          <Link
            href="/college/recruiting/news"
            className="text-sm font-medium text-primary hover:underline"
          >
            All recruiting news
          </Link>
        </div>
      </header>

      {sports.length === 0 ? (
        <p className="text-muted-foreground">No sports configured yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {sports.map((sport) => (
            <li
              key={sport._id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <h2 className="text-lg font-bold">{sport.title}</h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                <Link
                  href={`/recruiting/${sport.slug}`}
                  className="text-primary hover:underline"
                >
                  Rankings
                </Link>
                <Link
                  href={`/recruiting/${sport.slug}/players`}
                  className="text-primary hover:underline"
                >
                  Player search
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
