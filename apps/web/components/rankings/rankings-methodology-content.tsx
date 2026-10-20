import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@redshirt-sports/ui/components/accordion";
import { Eye, List, Users } from "lucide-react";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { RankingsBallotsCta } from "@/components/rankings/rankings-ballots-cta";
import {
  OUTLIER_RANK_GAP,
  OUTLIER_TOP_OMIT_RANK,
} from "@/lib/ballot-outliers";
import { TOP_25 } from "@/lib/constants";

const SECTIONS = [
  { id: "how", label: "How the poll works" },
  { id: "points", label: "Points: 25 to 1" },
  { id: "fpv", label: "First-place votes" },
  { id: "onballots", label: "“On X of N ballots”" },
  { id: "lists", label: "Others, dropped out, no longer receiving votes" },
  { id: "eligibility", label: "Eligibility" },
  { id: "window", label: "Ballot window and automation" },
  { id: "transparency", label: "Transparency" },
  { id: "outliers", label: "Outlier policy" },
  { id: "faq", label: "FAQ" },
] as const;

const TIMELINE = [
  ["Sun 08:00 ET", "Window opens", "Voters receive email with their ballot link."],
  ["Sun 18:00 ET", "Reminder 1", "Automatic reminder to voters who have not submitted."],
  ["Mon 09:00 ET", "Reminder 2", "Final automatic reminder; admins see who is outstanding."],
  ["Mon 12:00 ET", "Window closes", "Ballots lock automatically unless an extension is posted on the poll page."],
  ["Mon 12:01 ET", "Tabulation", "Points, ranks, movement, and outlier flags are computed."],
  ["Mon / Tue", "Publish", "An admin reviews the outlier report and publishes; ballots go public at the same moment."],
] as const;

const FAQ = [
  [
    "Why can a team with fewer first-place votes rank higher?",
    "Rank is decided by total points, not first-place votes. First-place votes are shown for context and only break display order when points tie.",
  ],
  [
    "What does “On 12 of 22 ballots” mean?",
    "That many voters put the team somewhere in their Top 25; the rest left it off. It measures breadth of support, separate from points.",
  ],
  [
    "Can I see how a specific voter ranked my team?",
    "Yes. Open Ballots for the all-voters grid, or By voter for each voter's full ballot with differences from the consensus.",
  ],
  [
    "Does an outlier ballot get thrown out?",
    "No. Outliers are flagged so readers can see them, never changed or removed. Only invalid ballots can be voided, with the reason published.",
  ],
] as const;

function MethodSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b pb-8 last:border-0">
      <h2 className="font-display text-2xl font-extrabold uppercase">{title}</h2>
      <div className="mt-3 grid gap-3 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function TriCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </span>
      <div className="mt-3 font-display text-xl font-bold uppercase">{title}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function RankingsMethodologyContent({
  rankingsIndexHref,
  ballotsHref,
  byVoterHref,
  ballotsCounted,
  voterChips,
  weekLabel,
  panelSize,
}: {
  sport: string;
  rankingsIndexHref: string;
  ballotsHref: string;
  byVoterHref: string;
  ballotsCounted: number;
  voterChips: Array<{ id: string; label: string }>;
  weekLabel: string;
  panelSize: number;
}) {
  const maxPoints = panelSize * TOP_25;

  return (
    <div className="grid gap-10 pt-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
      <aside className="hidden lg:block">
        <nav
          className="sticky top-20 grid gap-0.5 text-sm"
          aria-label="On this page"
        >
          {SECTIONS.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={
                index === 0
                  ? "rounded-md bg-muted px-2 py-1.5 font-semibold text-foreground"
                  : "rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground"
              }
            >
              {section.label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="grid max-w-3xl content-start gap-8">
        <MethodSection id="how" title="How the poll works">
          <p>
            Each credentialed voter submits a ranked ballot of {TOP_25} teams
            every week; points are added up and the published Top {TOP_25} is
            the order of total points.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <TriCard
              icon={<Users className="size-5" aria-hidden />}
              title={`${panelSize} voters`}
              description="Invite-only panel, published every season"
            />
            <TriCard
              icon={<List className="size-5" aria-hidden />}
              title="25-to-1 points"
              description="1st place = 25 points … 25th = 1"
            />
            <TriCard
              icon={<Eye className="size-5" aria-hidden />}
              title="Every ballot public"
              description="Released with the poll, with outliers flagged"
            />
          </div>
        </MethodSection>

        <MethodSection id="points" title="Points: 25 to 1">
          <p>
            A team earns <b>26 minus its rank</b> on each ballot (25 for first,
            down to 1 for 25th). A team left off gets 0 from that voter. With{" "}
            {panelSize} voters the maximum is <b>{maxPoints} points</b> (
            {panelSize} × 25).
          </p>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
            {Array.from({ length: TOP_25 }, (_, i) => TOP_25 - i).map(
              (points, index) => (
                <div
                  key={points}
                  className="rounded-md border bg-card px-1 py-1.5 text-center"
                >
                  <div className="text-[10px] text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="font-display text-base font-bold tabular">
                    {points}
                  </div>
                </div>
              ),
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <b className="text-foreground">Ties</b> share a rank (shown as
            “T-12”) and the next rank is skipped. Within a tie, teams are listed
            by first-place votes, then alphabetically.
          </p>
        </MethodSection>

        <MethodSection id="fpv" title="First-place votes">
          <p>
            The number in parentheses after a team is how many voters ranked it
            No. 1. First-place votes add no bonus beyond the 25 points already
            counted; they show how decisive the top spot is.
          </p>
        </MethodSection>

        <MethodSection id="onballots" title="“On X of N ballots”">
          <p>
            <b>On X of {panelSize} ballots</b> means X voters ranked that team
            somewhere from 1 to 25, and the rest left it off. It measures how{" "}
            <i>broad</i> support is, which points alone can hide.
          </p>
        </MethodSection>

        <MethodSection
          id="lists"
          title="Others, dropped out, no longer receiving votes"
        >
          <ul className="grid gap-2 pl-5 [list-style:disc]">
            <li>
              <b>Others receiving votes</b>: teams with points outside the Top{" "}
              {TOP_25}, by points.
            </li>
            <li>
              <b>Dropped out of the Top {TOP_25}</b>: ranked last week, not
              ranked this week (may still be receiving votes).
            </li>
            <li>
              <b>No longer receiving votes</b>: had points last week, none this
              week.
            </li>
          </ul>
        </MethodSection>

        <MethodSection id="eligibility" title="Eligibility">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <div className="font-semibold">Voters</div>
              <ul className="mt-1 grid gap-1 pl-5 text-sm text-muted-foreground [list-style:disc]">
                <li>Invite-only credentialed media</li>
                <li>No athletics-department employees</li>
                <li>Conflicts disclosed publicly</li>
                <li>One ballot per voter per week</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="font-semibold">Teams</div>
              <ul className="mt-1 grid gap-1 pl-5 text-sm text-muted-foreground [list-style:disc]">
                <li>Programs in the division per the published eligibility list</li>
                <li>Transitioning programs follow the season rule on this page</li>
              </ul>
            </div>
          </div>
        </MethodSection>

        <MethodSection id="window" title="Ballot window and automation">
          <p>The weekly cycle (times are configurable per poll):</p>
          <ol className="relative grid gap-4 border-l pl-5">
            {TIMELINE.map(([time, title, body]) => (
              <li key={time} className="relative">
                <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-primary bg-card" />
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {time}
                </div>
                <div className="font-semibold">{title}</div>
                <p className="text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </MethodSection>

        <MethodSection id="transparency" title="Transparency">
          <ul className="grid gap-2 pl-5 [list-style:disc]">
            <li>
              <b>All ballots are public</b> when the poll publishes: the grid,
              each voter&apos;s ballot, and the voter roster.
            </li>
            <li>
              <b>Downloadable data</b>: ballots and results CSV with a
              reproducibility hash (coming soon).
            </li>
            <li>
              <b>Corrections log</b>: republish, void, or window extensions are
              listed on the poll page with a reason.
            </li>
          </ul>
        </MethodSection>

        <MethodSection id="outliers" title="Outlier policy">
          <p>
            A pick is flagged when a voter ranks a team{" "}
            <b>{OUTLIER_RANK_GAP} or more spots</b> from its published rank, or{" "}
            <b>leaves off a team ranked in the top {OUTLIER_TOP_OMIT_RANK}</b>.
            Thresholds are configuration, not code.
          </p>
          <ul className="grid gap-2 pl-5 [list-style:disc]">
            <li>Flags are informational; ballots are never altered.</li>
            <li>Voters may add a short note shown with the ballot.</li>
            <li>Only invalid ballots are voided, with the reason published.</li>
          </ul>
        </MethodSection>

        <MethodSection id="faq" title="FAQ">
          <Accordion type="single" collapsible defaultValue="item-0">
            {FAQ.map(([question, answer], index) => (
              <AccordionItem key={question} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </MethodSection>

        <p className="text-sm text-muted-foreground">
          <Link
            href={rankingsIndexHref}
            prefetch={false}
            className="text-primary underline-offset-2 hover:underline"
          >
            Back to rankings
          </Link>
        </p>
      </article>

      <aside className="hidden content-start gap-6 lg:grid">
        <RankingsBallotsCta
          variant="desktop"
          ballotsHref={ballotsHref}
          byVoterHref={byVoterHref}
          ballotsCounted={ballotsCounted}
          voterChips={voterChips}
          weekLabel={weekLabel}
        />
        <AdSlot width={300} height={250} className="mx-auto hidden lg:flex" />
      </aside>
    </div>
  );
}
