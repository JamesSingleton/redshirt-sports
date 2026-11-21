import type { QueryNewsletterPreviewResult } from "@redshirt-sports/sanity/types";
import { CalendarDays, MailX, Newspaper, Trophy } from "lucide-react";

import { SiteBreadcrumb } from "@/components/chrome/site-breadcrumb";
import { IssuePreview } from "./issue-preview";
import {
  NewsletterSignupForm,
  type PollOption,
} from "./newsletter-signup-form";

const PERKS = [
  {
    Icon: CalendarDays,
    title: "Sunday mornings",
    body: "One email a week, in time for coffee after Saturday's games.",
  },
  {
    Icon: Newspaper,
    title: "Every story, one place",
    body: "News, analysis, previews and recaps from FBS to Division III.",
  },
  {
    Icon: Trophy,
    title: "Top 25 alerts",
    body: "Pick your polls and get each one the moment it's published, with who moved and every voter's ballot.",
  },
  {
    Icon: MailX,
    title: "Leave any time",
    body: "Every issue has a one-click unsubscribe. We never share your email.",
  },
] as const;

export function NewsletterPageContent({
  posts,
  polls,
}: {
  posts: QueryNewsletterPreviewResult | null;
  polls: PollOption[];
}) {
  return (
    // The marker lets the footer hide its own signup band on this page.
    <div
      className="mx-auto max-w-site px-4 pt-5 pb-12 lg:px-6"
      data-newsletter-page
    >
      <SiteBreadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Newsletter" }]}
      />

      <section className="grid gap-10 border-b pt-6 pb-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <div className="kicker text-primary">Free weekly newsletter</div>
          <h1 className="mt-2 font-display text-[2.6rem] font-extrabold leading-[1.08] lg:text-headline-lg">
            The Week in College Sports
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Every story Redshirt Sports published this week, in your inbox
            Sunday morning. College football and basketball at every level, no
            noise.
          </p>
          <div className="mt-8 max-w-lg">
            <NewsletterSignupForm showConfirmStatus polls={polls} />
          </div>
        </div>
        <IssuePreview posts={posts} />
      </section>

      <section className="pt-10">
        <h2 className="font-display text-3xl font-extrabold">What you get</h2>
        <ul className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,15rem),1fr))]">
          {PERKS.map(({ Icon, title, body }) => (
            <li key={title} className="rounded-xl border bg-card p-4">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-display text-lg font-bold leading-tight">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
