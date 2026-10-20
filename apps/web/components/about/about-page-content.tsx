import { Button } from "@redshirt-sports/ui/components/button";
import Link from "next/link";

import { SiteBreadcrumb } from "@/components/chrome/site-breadcrumb";
import CustomImage from "@/components/sanity-image";
import { personHref } from "@/lib/person-href";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import { getSiteEmailDomain } from "@/lib/get-base-url";

const COVERAGE = [
  {
    title: "FCS",
    description:
      "The Football Championship Subdivision, our core beat: every conference, every week.",
  },
  {
    title: "FBS",
    description:
      "Group of Five and Power conference coverage with an FCS-first lens.",
  },
  {
    title: "Division II",
    description: "Recaps, previews and rankings across D-II football.",
  },
  {
    title: "Division III",
    description: "From the Stagg Bowl chase to small-college rivalries.",
  },
  {
    title: "Basketball",
    description: "Men's and women's college hoops, starting with mid-majors.",
  },
] as const;

type AboutAuthor = {
  _id: string;
  name: string;
  slug: string;
  roles?: string[] | null;
  image?: unknown;
};

export function AboutPageContent({ authors }: { authors: AboutAuthor[] }) {
  const emailDomain = getSiteEmailDomain();
  const methodologyHref = rankingsMethodologyHref("football", "fcs");

  return (
    <main id="main" className="mx-auto max-w-site px-4 pt-5 lg:px-6">
      <SiteBreadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <section className="border-b pb-10 pt-6" data-block="hero">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="max-w-3xl">
            <div className="kicker text-primary">About Redshirt Sports</div>
            <h1 className="mt-2 font-display text-[2.6rem] font-extrabold uppercase leading-none lg:text-headline-lg">
              Every level of college sports
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Independent coverage for fans of the programs the big outlets skip:
              FCS, Division II, Division III and mid-major basketball, plus a
              transparent, fan-readable Top 25.
            </p>
          </div>
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            role="img"
            aria-label="Hero photo placeholder"
          >
            <span className="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Hero photo
            </span>
          </div>
        </div>
      </section>

      <section className="border-b py-10" data-block="richText">
        <div className="max-w-prose">
          <h2 className="font-display text-3xl font-extrabold uppercase">
            Our mission
          </h2>
          <p className="mt-3 text-muted-foreground">
            Redshirt Sports covers college athletics at all levels with reporting,
            analysis and rankings, and publishes every poll ballot so readers can
            see exactly how the Top 25 is made.
          </p>
        </div>
      </section>

      <section className="border-b py-10" data-block="featureGrid">
        <h2 className="font-display text-3xl font-extrabold uppercase">
          What we cover
        </h2>
        <ul className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]">
          {COVERAGE.map((item) => (
            <li key={item.title} className="rounded-xl border bg-card p-4">
              <h3 className="font-display text-2xl font-extrabold uppercase text-primary">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b py-10" data-block="callout">
        <div className="grid gap-6 rounded-xl border bg-muted/40 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="kicker text-primary">Redshirt Sports Poll</div>
            <h2 className="mt-1 font-display text-3xl font-extrabold uppercase">
              The Top 25, in the open
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              An invite-only panel of media who cover the sport votes each week, 25
              points for first down to 1 for 25th. Every ballot is published with
              the poll.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={methodologyHref} prefetch={false}>
                How the poll works
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/college/football/rankings" prefetch={false}>
                See the rankings
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b py-10" data-block="staffGrid">
        <h2 className="font-display text-3xl font-extrabold uppercase">
          Our staff
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Writers and editors. Each profile lives at{" "}
          <span className="font-mono">/people/[slug]</span>.
        </p>
        <ul className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,11rem),1fr))]">
          {authors.map((author) => (
            <li key={author._id}>
              <Link
                href={personHref(author.slug)}
                prefetch={false}
                className="group flex h-full flex-col items-center rounded-xl border bg-card p-4 text-center hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <CustomImage
                  image={author.image as Parameters<typeof CustomImage>[0]["image"]}
                  width={96}
                  height={96}
                  className="size-24 rounded-full object-cover object-top"
                  mode="cover"
                />
                <span className="mt-3 font-semibold group-hover:underline">
                  {author.name}
                </span>
                {author.roles?.length ? (
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {author.roles.join(" · ")}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-10" data-block="cta">
        <div className="grid gap-4 rounded-xl bg-ink p-6 text-ink-foreground md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold uppercase">
              Work with us
            </h2>
            <p className="mt-2 text-sm text-ink-foreground/75">
              Tips, corrections, advertising and partnerships.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button asChild>
              <Link href="/contact" prefetch={false}>Contact us</Link>
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-transparent text-ink-foreground hover:bg-white/10"
              asChild
            >
              <a href={`mailto:contact@${emailDomain}?subject=Advertising`}>
                Advertise
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
