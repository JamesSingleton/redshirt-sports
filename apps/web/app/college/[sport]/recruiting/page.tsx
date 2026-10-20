import { Badge } from "@redshirt-sports/ui/components/badge";
import type { Metadata } from "next";

import { recruits } from "@/lib/mock/portal";
import { getPageMetadata } from "@/lib/global-seo-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  return getPageMetadata(
    {
      title: "Recruiting",
      description: "Example recruiting hub. Not linked from navigation.",
      slug: `/college/${sport}/recruiting`,
      noIndex: true,
    },
    "published",
  );
}

export default async function RecruitingPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">Recruiting</div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        {sport.replace("-", " ")} recruiting
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Example list. Not in the main navigation.
      </p>
      <ul className="mt-6 divide-y rounded-xl border">
        {recruits.map((recruit) => (
          <li
            key={recruit.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <div className="font-semibold">{recruit.name}</div>
              <div className="text-muted-foreground text-sm">
                {recruit.pos} · {recruit.school} · {recruit.team}
              </div>
            </div>
            <Badge variant="secondary">{recruit.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
