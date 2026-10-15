import { urls } from "@redshirt-sports/seo/urls";
import { AdSlot } from "@redshirt-sports/ui/components/ad-slot";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@redshirt-sports/ui/components/alert";
import { ArchivePagination } from "@redshirt-sports/ui/components/archive-pagination";
import { FollowButton } from "@redshirt-sports/ui/components/follow-button";
import { OutboundLinkCard } from "@redshirt-sports/ui/components/outbound-link-card";
import { Progress } from "@redshirt-sports/ui/components/progress";
import { RankingsTable } from "@redshirt-sports/ui/components/rankings-table";
import { SiteHeader } from "@redshirt-sports/ui/components/site-header";
import { StoryCard } from "@redshirt-sports/ui/components/story-card";
import { TeamMark } from "@redshirt-sports/ui/components/team-mark";
import { Textarea } from "@redshirt-sports/ui/components/textarea";
import { TopTicker } from "@redshirt-sports/ui/components/top-ticker";
import { notFound } from "next/navigation";

import { isDesignRouteEnabled } from "@/lib/design-route";

const links = [
  { href: urls.sport("cfb"), label: "Football" },
  { href: urls.pollCurrent("cfb", "fcs"), label: "Rankings" },
  { href: urls.bracketDivision("cfb", "fcs"), label: "Bracket" },
];

const ranks = [
  { rank: 1, name: "Example State", points: 412, movement: 0 as const },
  { rank: 2, name: "Sample College", points: 388, movement: 2 as const },
  { rank: 3, name: "Demo University", points: 360, movement: "new" as const },
];

function Gallery({ title }: { title: string }) {
  return (
    <section className="mx-auto flex max-w-site flex-col gap-8 px-4 py-8">
      <h2 className="font-display text-headline">{title}</h2>
      <TopTicker
        items={[
          {
            href: urls.pollCurrent("cfb", "fcs"),
            label: "Example FCS poll is open",
          },
          { href: urls.news("cfb"), label: "Example State stays at No. 1" },
        ]}
      />
      <SiteHeader links={links} />
      <StoryCard
        variant="lead"
        href={urls.article({ primarySport: "cfb", slug: "example-state" })}
        kicker="FCS"
        title="Example State holds the top spot"
        dek="Local sample copy for the design gallery."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <StoryCard
          variant="river"
          href={urls.news("mbb")}
          kicker="Hoops"
          title="Sample College opens the season"
        />
        <StoryCard
          variant="compact"
          href={urls.person("example-writer")}
          title="Example Writer"
        />
      </div>
      <RankingsTable rows={ranks} />
      <div className="flex items-center gap-3">
        <TeamMark name="Example State" abbreviation="EX" />
        <FollowButton name="Example State" />
      </div>
      <AdSlot size="leaderboard" />
      <AdSlot size="rectangle" />
      <OutboundLinkCard
        href="https://example.com/stats"
        host="example.com"
        title="Example stats"
      />
      <Alert>
        <AlertTitle>Window open</AlertTitle>
        <AlertDescription>Voters can still submit this week.</AlertDescription>
      </Alert>
      <Progress value={40} label="Ballot completeness" />
      <Textarea aria-label="Notes" placeholder="Notes" />
      <ArchivePagination pathname={urls.news("cfb")} page={1} pageCount={3} />
    </section>
  );
}

export default function DesignPage() {
  if (!isDesignRouteEnabled()) {
    notFound();
  }

  return (
    <div>
      <Gallery title="Light" />
      <div className="dark bg-background text-foreground">
        <Gallery title="Dark" />
      </div>
    </div>
  );
}
