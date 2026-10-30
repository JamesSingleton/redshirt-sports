import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@redshirt-sports/ui/components/accordion";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { Eye, List, Users } from "lucide-react";

import { AdSlot } from "@/components/ad-slot";
import { MethodologySectionNav } from "@/components/rankings/methodology-section-nav";
import type { AdvertisementCreative } from "@/lib/advertisement";
import { OUTLIER_RANK_GAP } from "@/lib/ballot-outliers";
import { TOP_25 } from "@/lib/constants";

const SECTIONS = [
  { id: "how", label: "How the poll works" },
  { id: "points", label: "Points: 25 to 1" },
  { id: "fpv", label: "First-place votes" },
  { id: "onballots", label: "“On X of N ballots”" },
  { id: "lists", label: "Others, dropped out, no longer receiving votes" },
  { id: "eligibility", label: "Eligibility" },
  { id: "window", label: "Ballot window" },
  { id: "transparency", label: "Transparency" },
  { id: "outliers", label: "Outlier policy" },
  { id: "faq", label: "FAQ" },
] as const;

const TIMELINE = [
  [
    "48 hours before the week ends",
    "Voting opens",
    "The ballot for that week opens on the sports calendar, 48 hours before the week's window closes. It is not a fixed Saturday time.",
  ],
  [
    "Before the deadline",
    "Reminders",
    "Voters who haven't submitted may be reminded ahead of the deadline.",
  ],
  [
    "Mon., 9 a.m. Central",
    "Publish deadline",
    "Ballots are due by 9 a.m. Central (8 a.m. Mountain). A ballot stays editable until that week's poll is published.",
  ],
  [
    "When the poll publishes",
    "Tabulation",
    "Points, ranks, movement, and outlier flags are calculated.",
  ],
  [
    "Same moment",
    "Publish",
    "An admin reviews the outlier report and publishes the poll, and the ballots go public at the same moment.",
  ],
] as const;

const FAQ = [
  [
    "Why can a team with fewer first-place votes rank higher?",
    "The Top 25 is ordered by total points, not first-place votes. A team that's ranked high on more ballots can pass one with more No. 1 votes.",
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
    "No. Outliers are flagged so readers can see them. They are never changed or removed.",
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
    <section id={id} className="scroll-mt-28 border-b pb-8 last:border-0">
      <h2 className="font-display text-2xl font-extrabold uppercase">
        {title}
      </h2>
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
      <div className="mt-3 font-display text-xl font-bold uppercase">
        {title}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function RankingsMethodologyContent({
  advertisement = null,
}: {
  advertisement?: AdvertisementCreative | null;
}) {
  return (
    <div
      className={cn(
        "grid gap-10 pt-6 lg:grid-cols-[240px_minmax(0,1fr)]",
        advertisement && "lg:grid-cols-[240px_minmax(0,1fr)_300px]",
      )}
    >
      <aside className="hidden lg:block">
        <MethodologySectionNav sections={SECTIONS} />
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
              title="Invite-only voters"
              description="An invite-only panel, published every season"
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
            down to 1 for 25th). A team left off gets 0 from that voter. The
            maximum is <b>25 points times the number of voters</b>.
          </p>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
            {Array.from({ length: TOP_25 }, (_, i) => TOP_25 - i).map(
              (points, index) => (
                <div
                  key={points}
                  className="rounded-md border bg-card px-1 py-1.5 text-center"
                >
                  <div className="text-sm text-muted-foreground">
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
            <b>On X of N ballots</b> means X voters ranked that team somewhere
            from 1 to 25, and the rest left it off. It measures how <i>broad</i>{" "}
            support is, which points alone can hide.
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
                <li>
                  Voting is by invitation only. The panel includes media members
                  and others who follow the sport closely.
                </li>
                <li>
                  Each voter&apos;s affiliation is listed on the voter roster.
                </li>
                <li>One ballot per voter per week.</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="font-semibold">Teams</div>
              <ul className="mt-1 grid gap-1 pl-5 text-sm text-muted-foreground [list-style:disc]">
                <li>
                  Every program in the division is eligible, including schools
                  moving up from another division. Transitioning programs
                  aren&apos;t held out or penalized.
                </li>
              </ul>
            </div>
          </div>
        </MethodSection>

        <MethodSection id="window" title="Ballot window">
          <p>
            Opening time follows the sports calendar for that week. The Monday
            deadline below is Central.
          </p>
          <ol className="relative grid gap-4 border-l pl-5">
            {TIMELINE.map(([time, title, body]) => (
              <li key={time} className="relative">
                <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-primary bg-card" />
                <div className="text-sm font-semibold uppercase tracking-wide text-primary">
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
          </ul>
        </MethodSection>

        <MethodSection id="outliers" title="Outlier policy">
          <p>
            An outlier is a rank <b>{OUTLIER_RANK_GAP} or more spots</b> from
            that team&apos;s published rank. The published rank includes teams
            that received votes outside the Top {TOP_25}.
          </p>
          <p>
            Leaving a published Top {TOP_25} team off a ballot is listed on its
            own, separate from outliers. Ranking a team that missed the Top{" "}
            {TOP_25} is an outlier only when the gap is {OUTLIER_RANK_GAP} spots
            or more. A 25th-place vote for a team the poll placed just outside,
            within {OUTLIER_RANK_GAP - 1} spots, stays unflagged. A team with no
            published rank is unflagged too.
          </p>
          <ul className="grid gap-2 pl-5 [list-style:disc]">
            <li>Flags are informational; ballots are never altered.</li>
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
      </article>

      {advertisement ? (
        <aside className="hidden content-start lg:grid">
          <AdSlot
            placement="rankings-methodology-sidebar"
            creative={advertisement}
            className="hidden lg:block"
          />
        </aside>
      ) : null}
    </div>
  );
}
